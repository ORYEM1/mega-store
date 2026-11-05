<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Orders;
use App\Models\Payment;
use App\Models\Product;
use App\Services\AdminNotificationService;
use App\Services\Payments\MtnMomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(
        Request $request,
        AdminNotificationService $notifications,
        MtnMomoService $mtnMomo
    ) {
        // 1. Validate checkout information.
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],

            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:1000',
            ],

            'shipping_address' => [
                'required',
                'string',
                'max:2000',
            ],

            'payment_method' => [
                'required',
                'in:cash,mobile_money,bank_transfer,card',
            ],

            'mobile_money_provider' => [
                'required_if:payment_method,mobile_money',
                'nullable',
                'in:mtn_momo,airtel_money',
            ],

            'mobile_money_phone' => [
                'required_if:payment_method,mobile_money',
                'nullable',
                'regex:/^2567[0-9]{8}$/',
            ],

            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // 2. Get the authenticated customer.
        $customer = $request->user('sanctum');

        if (! $customer instanceof \App\Models\Customer) {
            return response()->json([
                'message' => 'Unauthenticated customer. Please log in again.',
            ], 401);
        }

        $isMobileMoney = $validated['payment_method'] === 'mobile_money';

        // 3. Airtel integration is not available yet.
        if (
            $isMobileMoney &&
            $validated['mobile_money_provider'] === 'airtel_money'
        ) {
            return response()->json([
                'message' => 'Airtel Money payment integration is not available yet.',
            ], 422);
        }

        // 4. Protect against sending UGX prices as EUR payments.
        if (
            $isMobileMoney &&
            config('services.mtn_momo.currency') !== 'UGX'
        ) {
            return response()->json([
                'message' => 'MTN payment is currently configured for sandbox testing. '
                    . 'Your store uses UGX, so payment initiation is disabled '
                    . 'until the payment currency is correctly configured.',
            ], 422);
        }

        // 5. Create the order.
        // Mobile money orders are NOT deducted from stock here.
        // Cash and other existing payment methods retain the previous behaviour.
        $order = DB::transaction(function () use (
            $validated,
            $customer,
            $isMobileMoney
        ) {
            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::query()
                    ->whereKey($item['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $quantity = (int) $item['quantity'];

                if ((int) $product->stock_quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Not enough stock for {$product->name}. "
                            . "Available: {$product->stock_quantity}; "
                            . "requested: {$quantity}.",
                        ],
                    ]);
                }

                $unitPrice = (float) $product->price;

                $itemSubtotal = round(
                    $unitPrice * $quantity,
                    2
                );

                $subtotal += $itemSubtotal;

                // Only deduct stock immediately for non-mobile-money orders.
                if (! $isMobileMoney) {
                    $product->stock_quantity =
                        (int) $product->stock_quantity - $quantity;

                    $product->save();
                }

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $subtotal = round($subtotal, 2);

            $order = Orders::create([
                'customer_id' => $customer->id,
                'order_number' => 'ORD-' . strtoupper(Str::random(10)),
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $validated['payment_method'],
                'shipping_address' => $validated['shipping_address'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $order->items()->createMany($orderItems);

            return $order;
        });

        // 6. Initiate MTN MoMo payment if selected.
        $payment = null;

        if ($isMobileMoney) {
            $externalId = 'PAY-' . Str::uuid();

            // Create a pending payment record before contacting MTN.
            $payment = Payment::create([
                'order_id' => $order->orders_id,
                'provider' => 'mtn_momo',
                'external_id' => $externalId,
                'reference_id' => null,
                'phone_number' => $validated['mobile_money_phone'],
                'amount' => $order->total,
                'currency' => config('services.mtn_momo.currency'),
                'status' => 'pending',
            ]);

            try {
                $mtnResponse = $mtnMomo->requestToPay(
                    number_format((float) $order->total, 2, '.', ''),
                    $validated['mobile_money_phone'],
                    $externalId,
                    'Payment for order ' . $order->order_number
                );

                $payment->update([
                    'reference_id' => $mtnResponse['reference_id'],
                    'provider_response' => $mtnResponse,
                    'status' => $mtnResponse['accepted']
                        ? 'pending'
                        : 'failed',
                ]);

                if (! $mtnResponse['accepted']) {
                    $order->update([
                        'payment_status' => 'failed',
                    ]);

                    return response()->json([
                        'message' => 'MTN did not accept the payment request.',
                        'order_number' => $order->order_number,
                    ], 502);
                }
            } catch (\Throwable $exception) {
                report($exception);

                $payment->update([
                    'status' => 'failed',
                    'provider_response' => [
                        'error' => 'MTN payment request could not be completed.',
                    ],
                ]);

                $order->update([
                    'payment_status' => 'failed',
                ]);

                return response()->json([
                    'message' => 'Unable to initiate MTN payment. Please try again.',
                    'order_number' => $order->order_number,
                ], 502);
            }
        }

        // 7. Notify the admin.
        try {
            $notifications->send(
                'New Order Received',
                'Order #' . $order->order_number
                    . ' has been placed by '
                    . $customer->first_name . ' ' . $customer->last_name
                    . '. Total: UGX '
                    . number_format((float) $order->total),
                'success'
            );
        } catch (\Throwable $exception) {
            report($exception);
        }

        // 8. Return order information.
        $order->load('items.product', 'customer');

        return response()->json([
            'message' => $isMobileMoney
                ? 'Payment request sent. Please approve the request on your phone.'
                : 'Order placed successfully.',

            'order' => [
                'id' => $order->orders_id,
                'order_number' => $order->order_number,
                'subtotal' => $order->subtotal,
                'total' => $order->total,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'shipping_address' => $order->shipping_address,

                'items' => $order->items->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_name' => $item->product?->name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                    ];
                }),
            ],

            'payment' => $payment ? [
                'provider' => $payment->provider,
                'reference_id' => $payment->reference_id,
                'status' => $payment->status,
                'currency' => $payment->currency,
            ] : null,
        ], 201);
    }
}