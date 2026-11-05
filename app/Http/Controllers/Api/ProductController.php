<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Return published products for the online store.
     */
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->with('category:id,name,slug')
            ->where('is_published', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $products->transform(function ($product) {
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
                'stock_quantity' => (int) $product->stock_quantity,
                'in_stock' => (int) $product->stock_quantity > 0,
                'photo' => $product->photo
                    ? asset('storage/' . $product->photo)
                    : null,
                'category' => $product->category
                    ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'slug' => $product->category->slug,
                    ]
                    : null,
            ];
        });

        return response()->json($products);
    }
}
