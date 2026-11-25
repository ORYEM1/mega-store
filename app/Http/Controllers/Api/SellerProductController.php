<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerStaff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SellerProductController extends Controller
{
    /**
     * Return products belonging to the logged-in seller.
     */
    public function index(Request $request): JsonResponse
    {
        $sellerId = $this->getSellerId($request);

        $products = Product::query()
            ->where('seller_id', $sellerId)
            ->with([
                'category:id,name,slug',
                'sizes:id,product_id,size,stock_quantity',
            ])
            ->latest()
            ->paginate(15);

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Return active marketplace categories.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with([
                'children' => function ($query) {
                    $query->where('is_active', true)
                        ->select('id', 'name', 'slug', 'parent_id');
                },
            ])
            ->select('id', 'name', 'slug', 'parent_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Return available product classifications.
     */
    public function classifications(): JsonResponse
    {
        return response()->json([
            'product_levels' => [
                Product::LEVEL_AFFORDABLE => 'Affordable',
                Product::LEVEL_EXECUTIVE => 'Executive',
            ],

            'executive_categories' => Product::EXECUTIVE_CATEGORIES,
        ]);
    }

    /**
     * Create a new product.
     *
     * Products created by sellers require admin approval.
     */
    public function store(Request $request): JsonResponse
    {
        // Affordable is the default collection.
        $request->merge([
            'product_level' => $request->input(
                'product_level',
                Product::LEVEL_AFFORDABLE
            ),
        ]);

        $productLevel = $request->input('product_level');

        $validated = $request->validate([

            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('is_active', true),
            ],

            'product_level' => [
                'required',
                Rule::in([
                    Product::LEVEL_AFFORDABLE,
                    Product::LEVEL_EXECUTIVE,
                ]),
            ],

            'executive_category' => [
                Rule::requiredIf(
                    $productLevel === Product::LEVEL_EXECUTIVE
                ),
                'nullable',
                'prohibited_unless:product_level,executive',
                Rule::in(array_keys(Product::EXECUTIVE_CATEGORIES)),
            ],

            'name' => ['required', 'string', 'max:255'],

            'description' => ['nullable', 'string'],

            'price' => ['required', 'numeric', 'min:0.01'],

            'compare_at_price' => [
                'nullable',
                'numeric',
                'gt:price',
            ],

            'color' => ['nullable', 'string', 'max:100'],

            'size' => ['nullable', 'string', 'max:100'],

            'stock_quantity' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'sizes' => ['sometimes', 'array', 'max:50'],

            'sizes.*.size' => [
                'required_with:sizes',
                'string',
                'max:50',
                'distinct',
            ],

            'sizes.*.stock_quantity' => [
                'required_with:sizes',
                'integer',
                'min:0',
            ],
        ]);

        $sellerId = $this->getSellerId($request);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')
                ->store('products', 'public');
        }

        $sizes = $validated['sizes'] ?? [];

        $totalStock = !empty($sizes)
            ? collect($sizes)->sum('stock_quantity')
            : ($validated['stock_quantity'] ?? 0);

        try {
            $product = DB::transaction(function () use (
                $validated,
                $sellerId,
                $photoPath,
                $sizes,
                $totalStock
            ) {
                $product = Product::create([
                    'seller_id' => $sellerId,

                    'category_id' => $validated['category_id'] ?? null,

                    'product_level' => $validated['product_level'],

                    'executive_category' =>
                        $validated['product_level'] === Product::LEVEL_EXECUTIVE
                            ? $validated['executive_category']
                            : null,

                    'name' => $validated['name'],

                    'description' => $validated['description'] ?? null,

                    'price' => $validated['price'],

                    'compare_at_price' =>
                        $validated['compare_at_price'] ?? null,

                    'color' => $validated['color'] ?? null,

                    'size' => $validated['size'] ?? null,

                    'stock_quantity' => $totalStock,

                    'photo' => $photoPath,

                    // Admin must approve the product.
                    'is_published' => false,
                ]);

                foreach ($sizes as $size) {
                    $product->sizes()->create([
                        'size' => $size['size'],
                        'stock_quantity' => $size['stock_quantity'],
                    ]);
                }

                return $product;
            });
        } catch (\Throwable $exception) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Product created successfully. It is awaiting admin approval.',

            'product' => $product->load([
                'category',
                'sizes',
            ]),
        ], 201);
    }

    /**
     * Show one product belonging to the seller.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $product = Product::query()
            ->where('seller_id', $this->getSellerId($request))
            ->with([
                'category',
                'sizes',
            ])
            ->findOrFail($id);

        return response()->json([
            'product' => $product,
        ]);
    }

    /**
     * Update a product belonging to the seller.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::query()
            ->where('seller_id', $this->getSellerId($request))
            ->findOrFail($id);

        $levelWasProvided = $request->exists('product_level');

        $effectiveProductLevel = $request->input(
            'product_level',
            $product->product_level ?? Product::LEVEL_AFFORDABLE
        );

        $executiveCategoryWasProvided = $request->exists(
            'executive_category'
        );

        // Use the effective level when validating partial updates.
        $request->merge([
            'product_level' => $effectiveProductLevel,
        ]);

        $requiresExecutiveCategory =
            $effectiveProductLevel === Product::LEVEL_EXECUTIVE
            && (
                blank($product->executive_category)
                || (
                    $levelWasProvided
                    && $product->product_level !== Product::LEVEL_EXECUTIVE
                )
                || (
                    $executiveCategoryWasProvided
                    && blank($request->input('executive_category'))
                )
            );

        $validated = $request->validate([

            'category_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('is_active', true),
            ],

            'product_level' => [
                'required',
                Rule::in([
                    Product::LEVEL_AFFORDABLE,
                    Product::LEVEL_EXECUTIVE,
                ]),
            ],

            'executive_category' => [
                Rule::requiredIf($requiresExecutiveCategory),
                'nullable',
                'prohibited_unless:product_level,executive',
                Rule::in(array_keys(Product::EXECUTIVE_CATEGORIES)),
            ],

            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'description' => ['sometimes', 'nullable', 'string'],

            'price' => ['sometimes', 'required', 'numeric', 'min:0.01'],

            'compare_at_price' => [
                'sometimes',
                'nullable',
                'numeric',
            ],

            'color' => ['sometimes', 'nullable', 'string', 'max:100'],

            'size' => ['sometimes', 'nullable', 'string', 'max:100'],

            'stock_quantity' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'photo' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'sizes' => ['sometimes', 'array', 'max:50'],

            'sizes.*.size' => [
                'required_with:sizes',
                'string',
                'max:50',
                'distinct',
            ],

            'sizes.*.stock_quantity' => [
                'required_with:sizes',
                'integer',
                'min:0',
            ],
        ]);

        // Never retain an Executive subcategory for Affordable products.
        if ($effectiveProductLevel === Product::LEVEL_AFFORDABLE) {
            $validated['executive_category'] = null;
        }

        $oldPhoto = $product->photo;
        $newPhoto = null;

        if ($request->hasFile('photo')) {
            $newPhoto = $request->file('photo')
                ->store('products', 'public');

            $validated['photo'] = $newPhoto;
        }

        // Sellers cannot publish products through this endpoint.
        unset(
            $validated['is_published'],
            $validated['seller_id']
        );

        try {
            DB::transaction(function () use (
                $product,
                $validated
            ) {
                $productData = collect($validated)
                    ->except(['sizes'])
                    ->toArray();

                $product->fill($productData);

                if (array_key_exists('sizes', $validated)) {
                    $sizes = $validated['sizes'];

                    $product->stock_quantity = collect($sizes)
                        ->sum('stock_quantity');

                    // Replace the product's existing size variations.
                    $product->sizes()->delete();

                    foreach ($sizes as $size) {
                        $product->sizes()->create([
                            'size' => $size['size'],
                            'stock_quantity' => $size['stock_quantity'],
                        ]);
                    }
                }

                $product->save();
            });
        } catch (\Throwable $exception) {
            if ($newPhoto) {
                Storage::disk('public')->delete($newPhoto);
            }

            throw $exception;
        }

        if ($newPhoto && $oldPhoto) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return response()->json([
            'message' => 'Product updated successfully.',

            'product' => $product->fresh()
                ->load([
                    'category',
                    'sizes',
                ]),
        ]);
    }

    /**
     * Delete a product belonging to the seller.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $product = Product::query()
            ->where('seller_id', $this->getSellerId($request))
            ->findOrFail($id);

        if ($product->photo) {
            Storage::disk('public')->delete($product->photo);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    /**
     * Resolve the business owner's ID.
     *
     * A seller uses their own ID.
     * A staff member uses their associated seller_id.
     */
    private function getSellerId(Request $request): int
    {
        $user = $request->user();

        if ($user instanceof Seller) {
            return (int) $user->id;
        }

        if ($user instanceof SellerStaff) {
            return (int) $user->seller_id;
        }

        abort(403, 'Access denied. Seller account required.');
    }
}