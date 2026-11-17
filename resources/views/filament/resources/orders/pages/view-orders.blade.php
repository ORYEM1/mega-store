<x-filament-panels::page>

    @php
        $order = $this->record->loadMissing([
            'customer',
            'items.product',
        ]);
    @endphp

    {{-- Order and Customer Information --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
            <h2 class="text-lg font-bold mb-4">Order Information</h2>

            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-500">Order Number</span>
                    <strong>{{ $order->order_number }}</strong>
                </div>

                <div class="flex justify-between">
                    <span class="text-gray-500">Status</span>
                    <strong>{{ ucfirst($order->status) }}</strong>
                </div>

                <div class="flex justify-between">
                    <span class="text-gray-500">Payment Status</span>
                    <strong>{{ ucfirst($order->payment_status) }}</strong>
                </div>

                <div class="flex justify-between">
                    <span class="text-gray-500">Payment Method</span>
                    <strong>{{ $order->payment_method ?? 'N/A' }}</strong>
                </div>

                <div class="flex justify-between">
                    <span class="text-gray-500">Order Date</span>
                    <strong>{{ $order->created_at?->format('d M Y, H:i') }}</strong>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
            <h2 class="text-lg font-bold mb-4">Customer Information</h2>

            @if($order->customer)
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Name</span>
                        <strong>
                            {{ $order->customer->first_name }}
                            {{ $order->customer->last_name }}
                        </strong>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Email</span>
                        <strong>{{ $order->customer->email ?? 'N/A' }}</strong>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Phone</span>
                        <strong>{{ $order->customer->phone ?? 'N/A' }}</strong>
                    </div>
                </div>
            @else
                <p class="text-gray-500">Guest Customer</p>
            @endif

            <div class="mt-4">
                <span class="text-gray-500">Shipping Address</span>
                <p class="font-semibold mt-1">
                    {{ $order->shipping_address ?? 'No shipping address' }}
                </p>
            </div>
        </div>
    </div>

    {{-- Order Items --}}
    <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 overflow-hidden">

        <div class="p-5 border-b dark:border-gray-700">
            <h2 class="text-lg font-bold">Order Items</h2>
            <p class="text-sm text-gray-500">
                {{ $order->items->count() }} item(s)
            </p>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th class="p-4 text-left">Product</th>
                        <th class="p-4 text-left">Size</th>
                        <th class="p-4 text-center">Quantity</th>
                        <th class="p-4 text-right">Unit Price</th>
                        <th class="p-4 text-right">Subtotal</th>
                    </tr>
                </thead>

                <tbody>
                    @forelse($order->items as $item)
                        <tr class="border-t dark:border-gray-700">
                            <td class="p-4 font-semibold">
                                {{ $item->product?->name ?? 'Product #' . $item->product_id }}
                            </td>

                            <td class="p-4">
                                {{ $item->size ?? 'N/A' }}
                            </td>

                            <td class="p-4 text-center">
                                {{ $item->quantity }}
                            </td>

                            <td class="p-4 text-right">
                                UGX {{ number_format((float) $item->unit_price) }}
                            </td>

                            <td class="p-4 text-right font-semibold">
                                UGX {{ number_format((float) $item->subtotal) }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="p-8 text-center text-gray-500">
                                No items found in this order.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{-- Totals --}}
        <div class="p-5 border-t dark:border-gray-700">
            <div class="max-w-sm ml-auto space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-500">Subtotal</span>
                    <strong>
                        UGX {{ number_format((float) $order->subtotal) }}
                    </strong>
                </div>

                <div class="flex justify-between text-lg font-bold">
                    <span>Order Total</span>
                    <span>
                        UGX {{ number_format((float) $order->total) }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    {{-- Notes --}}
    @if($order->notes)
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5">
            <h2 class="text-lg font-bold mb-3">Order Notes</h2>
            <p>{{ $order->notes }}</p>
        </div>
    @endif

</x-filament-panels::page>
