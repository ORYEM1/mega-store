<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banners = Banner::query()
            ->where('is_active', true)

            // Publication start date
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })

            // Publication end date
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })

            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $data = $banners->map(function (Banner $banner) {

            return [
                'id' => $banner->id,

                // Banner content
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,

                // Desktop image
                'image' => $banner->image,
                'image_url' => $banner->image
                    ? asset('storage/' . $banner->image)
                    : null,

                // Mobile image
                'mobile_image' => $banner->mobile_image,
                'mobile_image_url' => $banner->mobile_image
                    ? asset('storage/' . $banner->mobile_image)
                    : null,

                // Button
                'button_text' => $banner->button_text,
                'button_link' => $banner->button_link,

                // Banner placement
                'position' => $banner->position,
                'collection' => $banner->collection ?? 'all',

                // Product level
                'product_level' => $banner->product_level,

                // Configurable price range
                'min_price' => $banner->min_price,
                'max_price' => $banner->max_price,

                // Display settings
                'sort_order' => $banner->sort_order,
                'is_active' => $banner->is_active,

                // Publication schedule
                'starts_at' => $banner->starts_at,
                'ends_at' => $banner->ends_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}