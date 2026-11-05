<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banners = Banner::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
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
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,

                'image' => $banner->image,
                'image_url' => $banner->image
                    ? asset('storage/' . $banner->image)
                    : null,

                'mobile_image' => $banner->mobile_image,
                'mobile_image_url' => $banner->mobile_image
                    ? asset('storage/' . $banner->mobile_image)
                    : null,

                'button_text' => $banner->button_text,
                'button_link' => $banner->button_link,

                'position' => $banner->position,
                'sort_order' => $banner->sort_order,
                'is_active' => $banner->is_active,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}