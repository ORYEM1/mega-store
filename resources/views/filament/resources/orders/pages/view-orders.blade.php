<x-filament-panels::page>
    @php
        $order = $this->record->loadMissing([
            'customer',
            'items.product',
        ]);
    @endphp

    <div class="space-y-6">

        {{-- ORDER AND CUSTOMER INFORMATION --}}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {{-- ORDER INFORMATION --}}
            <div
                class="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-900"
                style="border: 1px solid #9ca3af;"
            >

                <div
                    class="px-6 py-5 text-white"
                    style="background: #252525; border-bottom: 3px solid #c6ff00;"
                >
                    <div class="flex items-center justify-between gap-3">
                        <h2 class="text-lg font-bold">Order Information</h2>

                        <span
                            class="text-xs font-semibold px-3 py-1 rounded-full text-white"
                            style="border: 1px solid #c6ff00;"
                        >
                            {{ $order->order_number }}
                        </span>
                    </div>
                </div>

                <div class="divide-y divide-gray-200 dark:divide-gray-700">

                    <div class="flex justify-between items-center px-6 py-5 gap-4">
                        <span class="text-gray-500">Status</span>
                        <strong>{{ ucfirst($order->status) }}</strong>
                    </div>

                    <div class="flex justify-between items-center px-6 py-5 gap-4">
                        <span class="text-gray-500">Payment Status</span>
                        <strong>{{ ucfirst($order->payment_status) }}</strong>
                    </div>

                    <div class="flex justify-between items-center px-6 py-5 gap-4">
                        <span class="text-gray-500">Payment Method</span>
                        <strong>{{ ucfirst($order->payment_method ?? 'N/A') }}</strong>
                    </div>

                    <div class="flex justify-between items-center px-6 py-5 gap-4">
                        <span class="text-gray-500">Order Date</span>
                        <strong>{{ $order->created_at?->format('d M Y, H:i') }}</strong>
                    </div>

                </div>
            </div>


            {{-- CUSTOMER INFORMATION --}}
            <div
                class="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-900"
                style="border: 1px solid #9ca3af;"
            >

                <div
                    class="px-6 py-5 text-white"
                    style="background: #252525; border-bottom: 3px solid #c6ff00;"
                >
                    <h2 class="text-lg font-bold">Customer Information</h2>
                </div>

                @if($order->customer)

                    <div class="divide-y divide-gray-200 dark:divide-gray-700">

                        <div class="flex justify-between px-6 py-5 gap-4">
                            <span class="text-gray-500">Name</span>

                            <strong class="text-right">
                                {{ $order->customer->first_name }}
                                {{ $order->customer->last_name }}
                            </strong>
                        </div>

                        <div class="flex justify-between px-6 py-5 gap-4">
                            <span class="text-gray-500">Email</span>

                            <strong class="text-right break-all">
                                {{ $order->customer->email ?? 'N/A' }}
                            </strong>
                        </div>

                        <div class="flex justify-between px-6 py-5 gap-4">
                            <span class="text-gray-500">Phone</span>

                            <strong class="text-right">
                                {{ $order->customer->phone ?? 'N/A' }}
                            </strong>
                        </div>

                    </div>

                @else

                    <p class="px-6 py-5 text-gray-500">
                        Guest Customer
                    </p>

                @endif

                {{-- SHIPPING ADDRESS --}}
                <div
                    class="px-6 py-5 bg-gray-50 dark:bg-gray-800/50"
                    style="border-top: 2px solid #9ca3af;"
                >
                    <span class="text-sm font-semibold text-gray-500">
                        Shipping Address
                    </span>

                    <p class="font-semibold mt-2">
                        {{ $order->shipping_address ?? 'No shipping address' }}
                    </p>
                </div>

            </div>

        </div>


        {{-- ORDER ITEMS --}}
        <div
            class="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-900"
            style="border: 1px solid #9ca3af;"
        >

            {{-- ORDER ITEMS HEADER --}}
            <div
                class="px-6 py-5 text-white"
                style="background: #252525; border-bottom: 3px solid #c6ff00;"
            >
                <h2 class="text-lg font-bold">Order Items</h2>

                <p class="text-sm mt-1" style="color: #d1d5db;">
                    {{ $order->items->count() }} item(s) in this order
                </p>
            </div>


            {{-- MOBILE SCROLL INDICATOR --}}
            <div
                class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 sm:hidden"
                style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;"
            >
                ← Swipe horizontally to view all product details →
            </div>


            {{-- RESPONSIVE ITEMS TABLE --}}
            <div
                class="w-full"
                style="overflow-x: auto; -webkit-overflow-scrolling: touch;"
            >

                <table
                    class="text-sm border-collapse"
                    style="width: 100%; min-width: 850px; table-layout: fixed;"
                >

                    <colgroup>
                        <col style="width: 34%;">
                        <col style="width: 16%;">
                        <col style="width: 16%;">
                        <col style="width: 17%;">
                        <col style="width: 17%;">
                    </colgroup>


                    {{-- TABLE HEADER --}}
                    <thead style="background: #252525; color: white;">

                        <tr>

                            <th
                                class="px-8 py-5 text-left font-bold tracking-wide"
                                style="border-right: 1px solid #6b7280;"
                            >
                                Product
                            </th>

                            <th
                                class="px-5 py-5 text-center font-bold tracking-wide"
                                style="border-right: 1px solid #6b7280;"
                            >
                                Size
                            </th>

                            <th
                                class="px-5 py-5 text-center font-bold tracking-wide"
                                style="border-right: 1px solid #6b7280;"
                            >
                                Quantity
                            </th>

                            <th
                                class="px-5 py-5 text-right font-bold tracking-wide"
                                style="border-right: 1px solid #6b7280;"
                            >
                                Unit Price
                            </th>

                            <th class="px-8 py-5 text-right font-bold tracking-wide">
                                Subtotal
                            </th>

                        </tr>

                    </thead>


                    {{-- TABLE BODY --}}
                    <tbody>

                        @forelse($order->items as $item)

                            @php
                                $product = $item->product;

                                $imagePath = $product?->photo;

                                $imageUrl = $imagePath
                                    ? \Illuminate\Support\Facades\Storage::disk('public')->url($imagePath)
                                    : null;
                            @endphp

                            <tr
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                style="border-bottom: 2px solid #e5e7eb;"
                            >

                                {{-- PRODUCT --}}
                                <td
                                    class="px-8 py-6"
                                    style="border-right: 1px solid #d1d5db;"
                                >
                                    <div class="flex items-center gap-4">

                                        @if($imageUrl)

                                            <div
                                                class="rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0"
                                                style="width: 64px; height: 64px; min-width: 64px; border: 1px solid #9ca3af;"
                                            >
                                                <img
                                                    src="{{ $imageUrl }}"
                                                    alt="{{ $product?->name ?? 'Product image' }}"
                                                    loading="lazy"
                                                    style="width: 100%; height: 100%; object-fit: contain; display: block;"
                                                >
                                            </div>

                                        @else

                                            <div
                                                class="rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
                                                style="width: 64px; height: 64px; min-width: 64px; border: 1px solid #9ca3af;"
                                            >
                                                <span class="text-xs font-bold text-gray-400">
                                                    NO IMAGE
                                                </span>
                                            </div>

                                        @endif

                                        <div class="min-w-0">
                                            <p class="font-bold text-gray-900 dark:text-white">
                                                {{ $product?->name ?? 'Product #' . $item->product_id }}
                                            </p>

                                            <p class="text-xs text-gray-500 mt-2">
                                                Product ID: {{ $item->product_id }}
                                            </p>
                                        </div>

                                    </div>
                                </td>


                                {{-- SIZE --}}
                                <td
                                    class="px-5 py-6 text-center"
                                    style="border-right: 1px solid #d1d5db;"
                                >
                                    <span class="inline-flex px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-semibold">
                                        {{ $item->size ?? 'N/A' }}
                                    </span>
                                </td>


                                {{-- QUANTITY --}}
                                <td
                                    class="px-5 py-6 text-center"
                                    style="border-right: 1px solid #d1d5db;"
                                >
                                    <span class="inline-flex items-center justify-center rounded-md px-3 py-1 font-bold bg-gray-100 dark:bg-gray-800">
                                        {{ $item->quantity }}
                                    </span>
                                </td>


                                {{-- UNIT PRICE --}}
                                <td
                                    class="px-5 py-6 text-right whitespace-nowrap"
                                    style="border-right: 1px solid #d1d5db;"
                                >
                                    UGX {{ number_format((float) $item->unit_price) }}
                                </td>


                                {{-- SUBTOTAL --}}
                                <td class="px-8 py-6 text-right font-bold whitespace-nowrap">
                                    UGX {{ number_format((float) $item->subtotal) }}
                                </td>

                            </tr>

                        @empty

                            <tr>
                                <td colspan="5" class="p-10 text-center text-gray-500">
                                    No items found in this order.
                                </td>
                            </tr>

                        @endforelse

                    </tbody>

                </table>

            </div>


            {{-- ORDER TOTALS --}}
            <div
                class="p-6 bg-gray-50 dark:bg-gray-800/50"
                style="border-top: 2px solid #9ca3af;"
            >

                <div class="max-w-sm ml-auto space-y-5">

                    <div class="flex justify-between text-gray-500">
                        <span>Subtotal</span>

                        <strong class="text-gray-900 dark:text-white">
                            UGX {{ number_format((float) $order->subtotal) }}
                        </strong>
                    </div>

                    <div
                        class="flex justify-between items-center text-lg font-bold pt-5"
                        style="border-top: 2px solid #9ca3af;"
                    >
                        <span>Order Total</span>

                        <span style="color: #84cc16;">
                            UGX {{ number_format((float) $order->total) }}
                        </span>
                    </div>

                </div>

            </div>

        </div>


        {{-- ORDER NOTES --}}
        @if($order->notes)

            <div
                class="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-900"
                style="border: 1px solid #9ca3af;"
            >

                <div
                    class="px-6 py-5 text-white"
                    style="background: #252525; border-bottom: 3px solid #c6ff00;"
                >
                    <h2 class="text-lg font-bold">
                        Order Notes
                    </h2>
                </div>

                <div class="p-6">
                    <p class="text-gray-600 dark:text-gray-300 leading-7">
                        {{ $order->notes }}
                    </p>
                </div>

            </div>

        @endif

    </div>

</x-filament-panels::page>