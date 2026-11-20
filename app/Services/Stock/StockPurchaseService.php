<?php

namespace App\Services\Stock;

use App\Models\Product;
use App\Models\ProductSize;
use App\Models\StockMovement;
use App\Models\StockPurchase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockPurchaseService
{
    /**
     * Receive a stock purchase and update inventory.
     */
    public function receive(StockPurchase $purchase): StockPurchase
    {
        return DB::transaction(function () use ($purchase) {

            // Lock the purchase to prevent simultaneous receiving.
            $purchase = StockPurchase::query()
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Prevent receiving the same purchase twice.
            if ($purchase->status === 'received') {
                throw ValidationException::withMessages([
                    'status' => 'This purchase has already been received.',
                ]);
            }

            if ($purchase->status !== 'draft') {
                throw ValidationException::withMessages([
                    'status' => 'Only draft purchases can be received.',
                ]);
            }

            $items = $purchase->items()->get();

            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Cannot receive a purchase without items.',
                ]);
            }

            foreach ($items as $item) {

                // Lock the product before changing its inventory.
                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Check whether this product uses sizes.
                $hasSizes = ProductSize::query()
                    ->where('product_id', $product->id)
                    ->exists();

                if ($hasSizes) {

                    if (!$item->product_size_id) {
                        throw ValidationException::withMessages([
                            'items' => "Please select a size for {$product->name}.",
                        ]);
                    }

                    // Ensure the selected size belongs to this product.
                    $size = ProductSize::query()
                        ->whereKey($item->product_size_id)
                        ->where('product_id', $product->id)
                        ->lockForUpdate()
                        ->first();

                    if (!$size) {
                        throw ValidationException::withMessages([
                            'items' => "The selected size does not belong to {$product->name}.",
                        ]);
                    }

                    $quantityBefore = $size->stock_quantity;

                    $size->stock_quantity += $item->quantity;
                    $size->save();

                    $quantityAfter = $size->stock_quantity;

                    // Recalculate the product's total stock.
                    $product->stock_quantity = $product->sizes()->sum('stock_quantity');
                    $product->save();

                } else {

                    if ($item->product_size_id) {
                        throw ValidationException::withMessages([
                            'items' => "{$product->name} does not have size variations.",
                        ]);
                    }

                    $quantityBefore = $product->stock_quantity;

                    $product->stock_quantity += $item->quantity;
                    $product->save();

                    $quantityAfter = $product->stock_quantity;
                }

                // Record the stock movement.
                StockMovement::create([
                    'product_id' => $product->id,
                    'product_size_id' => $item->product_size_id,
                    'user_id' => auth()->id() ?? $purchase->user_id,
                    'type' => 'purchase',
                    'quantity' => $item->quantity,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $quantityAfter,
                    'reference' => $purchase->purchase_number,
                    'notes' => 'Stock received from supplier purchase.',
                ]);
            }

            // Mark the purchase as received.
            $purchase->status = 'received';
            $purchase->save();

            return $purchase->fresh([
                'supplier',
                'items.product',
                'items.productSize',
            ]);
        });
    }
}
