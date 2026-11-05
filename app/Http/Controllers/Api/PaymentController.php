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

class PaymentController extends Controller
{
    /**
     * Check the status of an MTN MoMo payment.
     */
    public function checkStatus(
        Request $request,
        string $referenceId,
        MtnMomoService $mtnMomo
    ) {
        // 1. Get the authenticated customer.
        $customer = $request->user('sanctum');

        if (! $customer instanceof Customer) {
            return response()->json([
                'message' => 'Please log in again.',
            ], 401);
        }

        // 2. Find the payment.
        $payment = Payment::with('order.items')
            ->where('reference_id', $referenceId)
            ->first();

        if (! $payment) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        // 3. Ensure the payment belongs to this customer.
        if ((int) $payment->order->customer_id !== (int) $customer->id) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        // 4. Avoid processing a payment twice.
        if ($payment->status === 'paid') {
            return response()->json([
                'message' => 'Payment already confirmed.',
                'payment_status' => 'paid',
                'order_number' => $payment->order->order_number,
            ]);
        }

        if ($payment->provider !== 'mtn_momo') {
            return response()->json([
                'message' => 'Unsupported payment provider.',
            ], 422);
        }

        // 5. Ask MTN for the actual transaction status.
        try {
            $providerResponse = $mtnMomo->checkPaymentStatus(
                $payment->reference_id
            );
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Unable to check payment status. Please try again.',
                'payment_status' => 'pending',
            ], 502);
        }

        $providerStatus = strtoupper(
            $providerResponse['status'] ?? ''
        );

        // 6. Verify the transaction details returned by MTN.
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

        $amountMatches =
            isset($providerResponse['amount']) &&
            (int) round((float) $payment->amount * 100) ===
            (int) round((float) $providerResponse['amount'] * 100);

        $transactionMatches =
            $externalIdMatches &&
            $currencyMatches &&
            $amountMatches;

        if ($providerStatus === 'SUCCESSFUL' && ! $transactionMatches) {
            report(new \RuntimeException(
                'MTN payment details do not match the stored payment.'
            ));

            return response()->json([
                'message' => 'Payment verification failed. Please contact support.',
                'payment_status' => 'pending',
            ], 409);
        }

        // 7. Finalize a successful payment.
        if ($providerStatus === 'SUCCESSFUL') {
            $result = DB::transaction(function () use (
                $payment,
                $providerResponse
            ) {
                $lockedPayment = Payment::query()
                    ->whereKey($payment->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $order = Orders::query()
                    ->whereKey($lockedPayment->order_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Another request may already have confirmed this payment.
                if ($lockedPayment->status === 'paid') {
                    return [
                        'already_paid' => true,
                        'inventory_available' => true,
                    ];
                }

                // Check every product before deducting any stock.
                $products = [];
                $inventoryAvailable = true;

                foreach ($order->items as $item) {
                    $product = Product::query()
                        ->whereKey($item->product_id)
                        ->lockForUpdate()
                        ->first();

                    if (
                        ! $product ||
                        (int) $product->stock_quantity < (int) $item->quantity
                    ) {
                        $inventoryAvailable = false;
                        break;
                    }

                    $products[] = [
                        'product' => $product,
                        'quantity' => (int) $item->quantity,
                    ];
                }

                // Deduct stock only if every item is available.
                if ($inventoryAvailable) {
                    foreach ($products as $entry) {
                        $product = $entry['product'];

                        $product->stock_quantity =
                            (int) $product->stock_quantity -
                            $entry['quantity'];

                        $product->save();
                    }
                }

                // MTN has confirmed payment.
                $lockedPayment->update([
                    'status' => 'paid',
                    'provider_response' => $providerResponse,
                    'paid_at' => now(),
                ]);

                $order->payment_status = 'paid';

                // Keep the order pending for admin fulfilment.
                // If stock is unavailable, record the issue for resolution.
                if (! $inventoryAvailable) {
                    $order->notes = trim(
                        ($order->notes ?? '') .
                        "\nPayment successful, but inventory is insufficient. "
                        . "Admin must resolve fulfilment or arrange a refund."
                    );
                }

                $order->save();

                return [
                    'already_paid' => false,
                    'inventory_available' => $inventoryAvailable,
                ];
            });

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

        // 8. Handle unsuccessful payments.
        if (in_array($providerStatus, ['FAILED', 'REJECTED'], true)) {
            DB::transaction(function () use ($payment, $providerResponse) {
                $lockedPayment = Payment::query()
                    ->whereKey($payment->id)
                    ->lockForUpdate()
                    ->firstOrFail();

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

        // 9. Any other status remains pending.
        $payment->update([
            'provider_response' => $providerResponse,
        ]);

        return response()->json([
            'message' => 'Payment is still being processed.',
            'payment_status' => 'pending',
        ]);
    }
}