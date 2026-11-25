<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Orders;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Payments\MtnMomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    /**
     * Check the status of an MTN MoMo payment.
     */
    public function checkStatus(Request $request,string $referenceId,MtnMomoService $mtnMomo)
    {
        // 1. Get the authenticated customer.
        $customer = $request->user('sanctum');

        if (! $customer instanceof Customer)
        {
            return response()->json(['message' => 'Please log in again.'], 401);
        }

        // 2. Find the payment and associated order.
        $payment = Payment::with('order.items')
            ->where('reference_id', $referenceId)
            ->first();

        if (! $payment || ! $payment->order)
        {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        // 3. Verify that this payment belongs to the customer.
        if ((int) $payment->order->customer_id !==(int) $customer->id)
        {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        // 4. Verify the payment provider.
        if ($payment->provider !== 'mtn_momo') {
            return response()->json([ 'message' => 'Unsupported payment provider.'], 422);
        }

        // 5. Return immediately for already completed payments.
        if ($payment->status === 'paid') {
            return response()->json([
                'message' => 'Payment already confirmed.',
                'payment_status' => 'paid',
                'order_number' => $payment->order->order_number,
            ]);
        }

        // 6. Do not repeatedly query MTN for terminal payments.
        if (in_array($payment->status, [
            'failed',
            'cancelled',
        ], true)) {
            return response()->json([
                'message' => 'This payment is no longer active.',
                'payment_status' => $payment->status,
                'order_number' => $payment->order->order_number,
            ]);
        }

        // 7. Ask MTN for the actual transaction status.
        try {
            $providerResponse = $mtnMomo->checkPaymentStatus(
                $payment->reference_id
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Unable to check payment status. Please try again.',
                'payment_status' => 'pending',
            ], 502);
        }

        $providerStatus = strtoupper(
            (string) ($providerResponse['status'] ?? '')
        );

        // 8. Verify transaction details returned by MTN.
        $externalIdMatches =
            isset($providerResponse['externalId']) &&
            hash_equals(
                (string) $payment->external_id,
                (string) $providerResponse['externalId']
            );

        $currencyMatches =
            isset($providerResponse['currency']) &&
            strtoupper((string) $payment->currency) ===
            strtoupper((string) $providerResponse['currency']);

        // Compare monetary values in minor units to avoid float precision issues.
        $amountMatches =
            isset($providerResponse['amount']) &&
            is_numeric($providerResponse['amount']) &&
            (int) round((float) $payment->amount * 100) ===
            (int) round((float) $providerResponse['amount'] * 100);

        $transactionMatches =
            $externalIdMatches &&
            $currencyMatches &&
            $amountMatches;

        // Never confirm a transaction whose details do not match.
        if ($providerStatus === 'SUCCESSFUL' && ! $transactionMatches)
        {
            report(new RuntimeException('MTN payment verification failed: transaction details do not match.' ));

            return response()->json([
                'message' => 'Payment verification failed. Please contact support.',
                'payment_status' => 'pending',
            ], 409);
        }

        // 9. Finalize a successful payment.
        if ($providerStatus === 'SUCCESSFUL') 
        {
            $result = DB::transaction(function () use ($payment,$providerResponse )
            {
                // Lock payment to prevent concurrent processing.
                $lockedPayment = Payment::query()
                    ->whereKey($payment->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Lock associated order.
                $order = Orders::query()
                    ->whereKey($lockedPayment->order_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Another request may have completed payment already.
                if ($lockedPayment->status === 'paid') {
                    return [
                        'inventory_available' => null,
                        'already_paid' => true,
                    ];
                }

                // Do not allow a terminal payment to be revived.
                if (in_array($lockedPayment->status, [
                    'failed',
                    'cancelled',
                ], true)) {
                    return [
                        'inventory_available' => false,
                        'already_paid' => false,
                        'terminal' => true,
                    ];
                }

                /*
                 * Check inventory for every order item before deducting
                 * anything. This prevents partial stock deductions.
                 */
                $inventoryEntries = [];
                $inventoryAvailable = true;

                foreach ($order->items as $item) {
                    // Lock the product.
                    $product = Product::query()
                        ->whereKey($item->product_id)
                        ->lockForUpdate()
                        ->first();

                    if (! $product) {
                        $inventoryAvailable = false;
                        break;
                    }

                    $quantity = (int) $item->quantity;
                    $selectedSize = $item->size;

                    // Determine whether this product has size variations.
                    $hasSizes = $product->sizes()->exists();

                    if ($hasSizes) {
                        // A product with sizes must have a selected size.
                        if (! $selectedSize) {
                            $inventoryAvailable = false;
                            break;
                        }

                        // Lock the exact size inventory record.
                        $sizeRecord = $product->sizes()
                            ->where('size', $selectedSize)
                            ->lockForUpdate()
                            ->first();

                        if (
                            ! $sizeRecord ||
                            (int) $sizeRecord->stock_quantity < $quantity
                        ) {
                            $inventoryAvailable = false;
                            break;
                        }

                        $inventoryEntries[] = [
                            'type' => 'size',
                            'record' => $sizeRecord,
                            'quantity' => $quantity,
                        ];
                    } else {
                        // Products without sizes use general product stock.
                        if (
                            $selectedSize !== null ||
                            (int) $product->stock_quantity < $quantity
                        ) {
                            $inventoryAvailable = false;
                            break;
                        }

                        $inventoryEntries[] = [
                            'type' => 'product',
                            'record' => $product,
                            'quantity' => $quantity,
                        ];
                    }
                }

                /*
                 * Deduct stock only if every order item has sufficient
                 * inventory.
                 */
                if ($inventoryAvailable) {
                    foreach ($inventoryEntries as $entry) {
                        $record = $entry['record'];

                        $record->stock_quantity =
                            (int) $record->stock_quantity -
                            $entry['quantity'];

                        $record->save();
                    }
                }

                // Record successful payment regardless of inventory status.
                $lockedPayment->update([
                    'status' => 'paid',
                    'provider_response' => $providerResponse,
                    'paid_at' => now(),
                ]);

                // Update order payment status.
                $order->payment_status = 'paid';

                // Keep the order pending until admin fulfilment.
                if (! $inventoryAvailable) {
                    $inventoryNote =
                        'Payment successful, but inventory is insufficient. '
                        . 'Admin must resolve fulfilment or arrange a refund.';

                    $existingNotes = trim((string) $order->notes);

                    if (! str_contains($existingNotes, $inventoryNote)) {
                        $order->notes = trim(
                            $existingNotes . "\n" . $inventoryNote
                        );
                    }
                }

                $order->save();

                return [
                    'inventory_available' => $inventoryAvailable,
                    'already_paid' => false,
                    'terminal' => false,
                ];
            });

            if (! empty($result['terminal'])) {
                return response()->json([
                    'message' => 'This payment is no longer active. Please contact support.',
                    'payment_status' => 'failed',
                ], 409);
            }

            if (! empty($result['already_paid'])) {
                return response()->json([
                    'message' => 'Payment already confirmed.',
                    'payment_status' => 'paid',
                    'order_number' => $payment->order->order_number,
                ]);
            }

            return response()->json([
                'message' => 'MTN payment successfully confirmed.',
                'payment_status' => 'paid',
                'order_number' => $payment->order->order_number,
                'inventory_available' => $result['inventory_available'],
                'fulfilment_message' => $result['inventory_available']
                    ? 'Your order is awaiting fulfilment.'
                    : 'Your payment succeeded, but stock needs admin attention.',
            ]);
        }

        // 10. Handle unsuccessful payments.
        if (in_array($providerStatus, [
            'FAILED',
            'REJECTED',
        ], true)) {
            DB::transaction(function () use (
                $payment,
                $providerResponse
            ) {
                $lockedPayment = Payment::query()
                    ->whereKey($payment->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Never overwrite an already successful payment.
                if ($lockedPayment->status === 'paid') {
                    return;
                }

                $lockedPayment->update([
                    'status' => 'failed',
                    'provider_response' => $providerResponse,
                ]);

                Orders::query()
                    ->whereKey($lockedPayment->order_id)
                    ->update([
                        'payment_status' => 'failed',
                    ]);
            });

            return response()->json([
                'message' => 'MTN payment was unsuccessful.',
                'payment_status' => 'failed',
            ]);
        }

        // 11. All other statuses remain pending.
        $payment->update([
            'provider_response' => $providerResponse,
        ]);

        return response()->json([
            'message' => 'Payment is still being processed.',
            'payment_status' => 'pending',
        ]);
    }
}