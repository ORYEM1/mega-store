<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Orders;
use App\Models\Payment;
use App\Models\Product;
use App\Services\AdminNotificationService;
use App\Services\Payments\MtnMomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class OrderController extends Controller
{
    /**
     * Get authenticated customer's order history.
     */
    public function index(Request $request)
    {
        $customer = $request->user('sanctum');

        if (! $customer instanceof Customer) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated customer.',
            ], 401);
        }

        $orders = Orders::query()
            ->with([
                'items.product',
                'payment',
            ])
            ->where('customer_id', $customer->id)
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    /**
     * Get details of one order belonging to the authenticated customer.
     */
    public function show(Request $request, string $order)
    {
        $customer = $request->user('sanctum');

        if (! $customer instanceof Customer) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated customer.',
            ], 401);
        }

        $orderDetails = Orders::query()
            ->with([
                'items.product',
                'payment',
            ])
            ->where('orders_id', $order)
            ->where('customer_id', $customer->id)
            ->first();

        if (! $orderDetails) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'order' => $orderDetails,
        ]);
    }

    /**
     * Create a customer order.
     */
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
                'exists:products,id',
            ],

            'items.*.size' => [
                'nullable',
                'string',
                'max:50',
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

        // 2. Prevent duplicate product + size combinations.
        $seenItems = [];

        foreach ($validated['items'] as $index => $item) {
            $productId = (string) $item['product_id'];
            $size = trim((string) ($item['size'] ?? ''));

            $combination = $productId . '::' . $size;

            if (isset($seenItems[$combination])) {
                throw ValidationException::withMessages([
                    "items.{$index}.size" => [
                        'This product and size combination appears more than once in your cart.',
                    ],
                ]);
            }

            $seenItems[$combination] = true;

            $validated['items'][$index]['size'] = $size !== ''
                ? $size
                : null;
        }

        // 3. Get authenticated customer.
        $customer = $request->user('sanctum');

        if (! $customer instanceof Customer) {
            return response()->json([
                'message' => 'Unauthenticated customer. Please log in again.',
            ], 401);
        }

        $isMobileMoney = $validated['payment_method'] === 'mobile_money';

        // 4. Reject unsupported Airtel integration.
        if (
            $isMobileMoney &&
            $validated['mobile_money_provider'] !== 'mtn_momo'
        ) {
            return response()->json([
                'message' => 'Airtel Money payment integration is not available yet.',
            ], 422);
        }

        // 5. Protect UGX orders from incorrect sandbox currency.
        $momoCurrency = strtoupper(
            (string) config('services.mtn_momo.currency')
        );

        if ($isMobileMoney && $momoCurrency !== 'UGX') {
            return response()->json([
                'message' => 'MTN payment is currently configured for sandbox testing. '
                    . 'Your store uses UGX, so customer payment initiation is disabled '
                    . 'until the correct Uganda payment configuration is available.',
            ], 422);
        }

        /*
         * 6. Create order and order items.
         *
         * Stock is deducted immediately for non-mobile-money orders.
         * Mobile-money stock is deducted only after confirmed payment.
         */
        $order = DB::transaction(function () use (
            $validated,
            $customer,
            $isMobileMoney
        ) {
            $subtotalCents = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $product = Product::query()
                    ->whereKey($item['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $quantity = (int) $item['quantity'];
                $selectedSize = $item['size'] ?? null;

                $hasSizes = $product->sizes()->exists();

                $sizeRecord = null;
                $availableStock = 0;

                if ($hasSizes) {
                    if (! $selectedSize) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "Please select a size for {$product->name}.",
                            ],
                        ]);
                    }

                    $sizeRecord = $product->sizes()
                        ->where('size', $selectedSize)
                        ->lockForUpdate()
                        ->first();

                    if (! $sizeRecord) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "The selected size {$selectedSize} is not available for {$product->name}.",
                            ],
                        ]);
                    }

                    $availableStock = (int) $sizeRecord->stock_quantity;
                } else {
                    if ($selectedSize !== null) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "{$product->name} does not have size variations.",
                            ],
                        ]);
                    }

                    $availableStock = (int) $product->stock_quantity;
                }

                if ($availableStock < $quantity) {
                    $stockDescription = $selectedSize
                        ? "Size {$selectedSize}"
                        : 'product';

                    throw ValidationException::withMessages([
                        'items' => [
                            "Not enough stock for {$product->name} ({$stockDescription}). "
                            . "Available: {$availableStock}; "
                            . "requested: {$quantity}.",
                        ],
                    ]);
                }

                $unitPriceCents = (int) round(
                    (float) $product->price * 100
                );

                $itemSubtotalCents = $unitPriceCents * $quantity;

                $subtotalCents += $itemSubtotalCents;

                if (! $isMobileMoney) {
                    if ($hasSizes) {
                        $sizeRecord->stock_quantity =
                            (int) $sizeRecord->stock_quantity - $quantity;

                        $sizeRecord->save();
                    } else {
                        $product->stock_quantity =
                            (int) $product->stock_quantity - $quantity;

                        $product->save();
                    }
                }

                $orderItems[] = [
                    'product_id' => $product->id,
                    'size' => $selectedSize,
                    'quantity' => $quantity,
                    'unit_price' => number_format(
                        $unitPriceCents / 100,
                        2,
                        '.',
                        ''
                    ),
                    'subtotal' => number_format(
                        $itemSubtotalCents / 100,
                        2,
                        '.',
                        ''
                    ),
                ];
            }

            $subtotal = number_format(
                $subtotalCents / 100,
                2,
                '.',
                ''
            );

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

        // 7. Initiate MTN payment.
        $payment = null;
        $paymentInitiationFailed = false;

        if ($isMobileMoney) {
            $externalId = 'PAY-' . Str::uuid();

            $payment = Payment::create([
                'order_id' => $order->orders_id,
                'provider' => 'mtn_momo',
                'external_id' => $externalId,
                'reference_id' => null,
                'phone_number' => $validated['mobile_money_phone'],
                'amount' => $order->total,
                'currency' => $momoCurrency,
                'status' => 'pending',
            ]);

            try {
                $mtnResponse = $mtnMomo->requestToPay(
                    number_format((float) $order->total, 2, '.', ''),
                    $validated['mobile_money_phone'],
                    $externalId,
                    'Payment for order ' . $order->order_number
                );

                if (
                    empty($mtnResponse['reference_id']) ||
                    ! isset($mtnResponse['accepted'])
                ) {
                    throw new RuntimeException(
                        'MTN returned an incomplete payment initiation response.'
                    );
                }

                $payment->update([
                    'reference_id' => $mtnResponse['reference_id'],
                    'provider_response' => $mtnResponse,
                    'status' => $mtnResponse['accepted']
                        ? 'pending'
                        : 'failed',
                ]);

                if (! $mtnResponse['accepted']) {
                    $paymentInitiationFailed = true;

                    $order->update([
                        'payment_status' => 'failed',
                    ]);
                }
            } catch (Throwable $exception) {
                report($exception);

                $paymentInitiationFailed = true;

                $payment->update([
                    'status' => 'failed',
                    'provider_response' => [
                        'error' => 'MTN payment request could not be completed.',
                    ],
                ]);

                $order->update([
                    'payment_status' => 'failed',
                ]);
            }
        }

        // 8. Notify administrators.
        try {
            $customerName = trim(
                $customer->first_name . ' ' . $customer->last_name
            );

            if ($paymentInitiationFailed) {
                $notifications->send(
                    'Order Received - Payment Failed',
                    'Order #' . $order->order_number
                        . ' was submitted by ' . $customerName
                        . ', but MTN payment initiation failed. '
                        . 'Amount: UGX '
                        . number_format((float) $order->total, 2),
                    'danger'
                );
            } elseif ($isMobileMoney) {
                $notifications->send(
                    'Order Received - Payment Pending',
                    'Order #' . $order->order_number
                        . ' was submitted by ' . $customerName
                        . '. Waiting for MTN payment confirmation. '
                        . 'Amount: UGX '
                        . number_format((float) $order->total, 2),
                    'warning'
                );
            } else {
                $notifications->send(
                    'New Order Received',
                    'Order #' . $order->order_number
                        . ' has been placed by ' . $customerName
                        . '. Payment method: '
                        . $order->payment_method
                        . '. Total: UGX '
                        . number_format((float) $order->total, 2),
                    'success'
                );
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        // 9. Load order details.
        $order->load('items.product');

        // 10. Return order response.
        if ($paymentInitiationFailed) {
            return response()->json([
                'message' => 'Your order was received, but MTN payment initiation failed. '
                    . 'Please contact support before attempting another payment.',
                'order' => [
                    'id' => $order->orders_id,
                    'order_number' => $order->order_number,
                    'total' => $order->total,
                    'payment_status' => $order->payment_status,
                ],
                'payment' => [
                    'provider' => 'mtn_momo',
                    'status' => 'failed',
                ],
            ], 502);
        }

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
                        'size' => $item->size,
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
