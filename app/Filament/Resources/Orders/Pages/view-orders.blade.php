<x-filament-panels::page>

    @php
        $order = $this->record->loadMissing([
            'customer',
            'items.product',
        ]);
    @endphp

    <div class="order-details-page space-y-6">

        {{-- =========================================
             ORDER AND CUSTOMER INFORMATION
        ========================================== --}}

        <div class="order-info-grid">

            {{-- Order Information --}}
            <section class="order-info-card">

                <h2 class="order-card-title">
                    Order Information
                </h2>

                <div class="order-info-list">

                    <div class="order-info-row">
                        <span class="order-info-label">Order Number</span>
                        <span class="order-info-value">
                            {{ $order->order_number }}
                        </span>
                    </div>

                    <div class="order-info-row">
                        <span class="order-info-label">Order Status</span>

                        <span class="order-status order-status-{{ $order->status }}">
                            {{ ucfirst($order->status) }}
                        </span>
                    </div>

                    <div class="order-info-row">
                        <span class="order-info-label">Payment Status</span>
                        <span class="order-info-value">
                            {{ ucfirst($order->payment_status) }}
                        </span>
                    </div>

                    <div class="order-info-row">
                        <span class="order-info-label">Payment Method</span>
                        <span class="order-info-value">
                            {{ $order->payment_method ?? 'N/A' }}
                        </span>
                    </div>

                    <div class="order-info-row">
                        <span class="order-info-label">Order Date</span>
                        <span class="order-info-value">
                            {{ $order->created_at?->format('d M Y, H:i') }}
                        </span>
                    </div>

                </div>

            </section>


            {{-- Customer Information --}}
            <section class="order-info-card">

                <h2 class="order-card-title">
                    Customer Information
                </h2>

                @if ($order->customer)

                    <div class="order-info-list">

                        <div class="order-info-row">
                            <span class="order-info-label">Name</span>
                            <span class="order-info-value">
                                {{ $order->customer->first_name }}
                                {{ $order->customer->last_name }}
                            </span>
                        </div>

                        <div class="order-info-row">
                            <span class="order-info-label">Email</span>
                            <span class="order-info-value">
                                {{ $order->customer->email ?? 'N/A' }}
                            </span>
                        </div>

                        <div class="order-info-row">
                            <span class="order-info-label">Phone</span>
                            <span class="order-info-value">
                                {{ $order->customer->phone ?? 'N/A' }}
                            </span>
                        </div>

                    </div>

                @else

                    <p class="order-info-label">
                        Guest Customer
                    </p>

                @endif

                <div class="order-shipping-address">

                    <span class="order-info-label">
                        Shipping Address
                    </span>

                    <p>
                        {{ $order->shipping_address ?? 'No shipping address' }}
                    </p>

                </div>

            </section>

        </div>


        {{-- =========================================
             ORDER ITEMS
        ========================================== --}}

        <section class="order-items-card">

            <div class="order-items-header">

                <div>
                    <h2 class="order-items-title">
                        Order Items
                    </h2>

                    <p class="order-items-count">
                        {{ $order->items->count() }}
                        item(s) in this order
                    </p>
                </div>

            </div>


            {{-- Product Table --}}
            <div class="order-table-wrapper">

                <table class="order-items-table">

                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Size</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse ($order->items as $item)

                            @php
                                $productImage = $item->product?->photo
                                    ? \Illuminate\Support\Facades\Storage::disk('public')->url($item->product->photo)
                                    : null;
                            @endphp

                            <tr>

                                {{-- Product Image and Name --}}
                                <td>

                                    <div class="order-product-cell">

                                        @if ($productImage)

                                            <img
                                                src="{{ $productImage }}"
                                                alt="{{ $item->product?->name ?? 'Product image' }}"
                                                class="order-product-image"
                                                loading="lazy"
                                                decoding="async"
                                            >

                                        @else

                                            <div class="order-product-image-placeholder">
                                                <span>AC.</span>
                                            </div>

                                        @endif

                                        <div class="order-product-details">

                                            <span class="order-product-name">
                                                {{ $item->product?->name ?? 'Product #' . $item->product_id }}
                                            </span>

                                            <span class="order-product-id">
                                                Product ID: {{ $item->product_id }}
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                {{-- Size --}}
                                <td>
                                    <span class="order-product-size">
                                        {{ $item->size ?? 'N/A' }}
                                    </span>
                                </td>


                                {{-- Quantity --}}
                                <td class="order-quantity">
                                    {{ $item->quantity }}
                                </td>


                                {{-- Unit Price --}}
                                <td class="order-price">
                                    UGX {{ number_format((float) $item->unit_price) }}
                                </td>


                                {{-- Subtotal --}}
                                <td class="order-item-subtotal">
                                    UGX {{ number_format((float) $item->subtotal) }}
                                </td>

                            </tr>

                        @empty

                            <tr>
                                <td colspan="5" class="order-empty-state">
                                    No items found in this order.
                                </td>
                            </tr>

                        @endforelse

                    </tbody>

                </table>

            </div>


            {{-- =========================================
                 ORDER TOTALS
            ========================================== --}}

            <div class="order-totals">

                <div class="order-totals-inner">

                    <div class="order-total-row">

                        <span class="order-total-label">
                            Subtotal
                        </span>

                        <span class="order-total-value">
                            UGX {{ number_format((float) $order->subtotal) }}
                        </span>

                    </div>


                    <div class="order-total-row order-grand-total">

                        <span class="order-total-label">
                            Order Total
                        </span>

                        <span class="order-total-value">
                            UGX {{ number_format((float) $order->total) }}
                        </span>

                    </div>

                </div>

            </div>

        </section>


        {{-- =========================================
             ORDER NOTES
        ========================================== --}}

        @if ($order->notes)

            <section class="order-notes-card">

                <h2 class="order-card-title">
                    Order Notes
                </h2>

                <p class="order-notes-content">
                    {{ $order->notes }}
                </p>

            </section>

        @endif

    </div>

</x-filament-panels::page>