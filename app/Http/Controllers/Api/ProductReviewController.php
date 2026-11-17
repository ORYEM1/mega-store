<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    /**
     * Submit a new review or update the customer's existing review.
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        if (!$product->is_published) {
            return response()->json([
                'message' => 'This product is not available for review.',
            ], 404);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['nullable', 'string', 'max:2000'],
        ]);

        $customer = $request->user();

        $review = ProductReview::updateOrCreate(
            [
                'product_id' => $product->id,
                'customer_id' => $customer->id,
            ],
            [
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
            ]
        );

        $product->loadCount('reviews')
            ->loadAvg('reviews', 'rating');

        return response()->json([
            'message' => 'Your product review has been saved.',
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'created_at' => $review->created_at,
                'updated_at' => $review->updated_at,
            ],
            'average_rating' => round(
                (float) ($product->reviews_avg_rating ?? 0),
                1
            ),
            'reviews_count' => $product->reviews_count,
        ]);
    }

    /**
     * Return reviews for a product.
     */
    public function index(Product $product): JsonResponse
    {
        if (!$product->is_published) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404);
        }

        $reviews = $product->reviews()
            ->with('customer:id,first_name,last_name')
            ->latest()
            ->paginate(10);

        return response()->json($reviews);
    }
}