<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * Return active parent categories and their active subcategories.
     * Cache the results in Redis for 10 minutes.
     */
    public function index(): JsonResponse
    {
        $categories = Cache::store('redis')
            ->remember('categories:active:v1', now()->addMinutes(10), function () {

                return Category::query()
                    ->whereNull('parent_id')
                    ->where('is_active', true)
                    ->with([
                        'children' => function ($query) {
                            $query->where('is_active', true)
                                ->select([
                                    'id',
                                    'name',
                                    'slug',
                                    'parent_id',
                                ])
                                ->orderBy('name');
                        },
                    ])
                    ->orderBy('name')
                    ->get([
                        'id',
                        'name',
                        'slug',
                        'description',
                    ]);
            });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}