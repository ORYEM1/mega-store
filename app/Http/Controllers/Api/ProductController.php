<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Return published products for the online store.
     * Cache the results in Redis for 10 minutes.
     */
    public function index(): JsonResponse
    {
        $products = Cache::store('redis')
            ->remember('products:published:v1', now()->addMinutes(10), function () {

               return Product::query()
                    ->with([
                        'category:id,name,slug',
                        'sizes:id,product_id,size,stock_quantity',
                    ])
                    ->withCount('reviews')
                    ->withAvg('reviews', 'rating')
                    ->where('is_published', true)
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(function ($product) {

                        // Check whether this product has size variations.
                        $hasSizes = $product->sizes->isNotEmpty();

                        // Calculate total stock across all sizes.
                        $totalStock = $hasSizes
                            ? (int) $product->sizes->sum('stock_quantity')
                            : (int) $product->stock_quantity;

                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'sku' => $product->sku,

                            'description' => $product->description,

                            'price' => (float) $product->price,

                            'compare_at_price' => $product->compare_at_price !== null
                                ? (float) $product->compare_at_price
                                : null,

                            // Combined stock for product cards.
                            'stock_quantity' => $totalStock,

                            'in_stock' => $totalStock > 0,

                            // Individual size variations.
                            'sizes' => $product->sizes
                                ->map(function ($size) {
                                    return [
                                        'id' => $size->id,
                                        'size' => $size->size,
                                        'stock_quantity' => (int) $size->stock_quantity,
                                        'in_stock' => (int) $size->stock_quantity > 0,
                                    ];
                                })
                                ->values()
                                ->toArray(),

                            'photo' => $product->photo,

                            'average_rating' => round(
                                (float) ($product->reviews_avg_rating ?? 0),
                                                                1
                                ),
                                
                                'reviews_count' => (int) $product->reviews_count,

                            'category' => $product->category
                                ? [
                                    'id' => $product->category->id,
                                    'name' => $product->category->name,
                                    'slug' => $product->category->slug,
                                ]
                                : null,
                        ];
                    })
                    ->toArray();
            });

        // Generate image URLs outside the cache.
        // This avoids caching localhost URLs for other devices.
        $products = collect($products)->map(function ($product) {

            $product['photo'] = $product['photo']
                ? asset('storage/' . $product['photo'])
                : null;

            return $product;
        });

        return response()->json($products);
    }
}