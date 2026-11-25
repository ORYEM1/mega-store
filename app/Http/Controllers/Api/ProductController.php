<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Return published products for the online store.
     *
     * Supports:
     * - Affordable products
     * - Executive products
     * - Executive subcategories
     *
     * Cache the complete published product list in Redis for 10 minutes.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_level' => [
                'nullable',
                Rule::in([
                    Product::LEVEL_AFFORDABLE,
                    Product::LEVEL_EXECUTIVE,
                ]),
            ],

            'executive_category' => [
                'nullable',
                Rule::in(array_keys(Product::EXECUTIVE_CATEGORIES)),
            ],
        ]);

        $products = Cache::store('redis')
            ->remember(
                'products:published:v2',
                now()->addMinutes(10),
                function () {

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

                                // Product classification.
                                'product_level' => $product->product_level
                                    ?? Product::LEVEL_AFFORDABLE,

                                'executive_category' => $product->executive_category,

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
                        ->values()
                        ->toArray();
                }
            );

        // Filter products after retrieving the cached collection.
        // This allows all filters to share one Redis cache.

        $products = collect($products);

        if (!empty($validated['product_level'])) {
            $products = $products->where(
                'product_level',
                $validated['product_level']
            );
        }

        if (!empty($validated['executive_category'])) {
            $products = $products
                ->where('product_level', Product::LEVEL_EXECUTIVE)
                ->where(
                    'executive_category',
                    $validated['executive_category']
                );
        }

        // Generate image URLs outside the cache.
        // This avoids caching localhost URLs for other devices.

        $products = $products->map(function ($product) {

            $product['photo'] = $product['photo']
                ? asset('storage/' . $product['photo'])
                : null;

            return $product;
        })->values();

        return response()->json($products);
    }
}