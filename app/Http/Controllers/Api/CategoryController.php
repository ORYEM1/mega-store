<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Return active parent categories and their active subcategories.
     */
    public function index(): JsonResponse
    {
        $categories = Category::query()
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

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}