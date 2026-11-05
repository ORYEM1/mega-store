<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'compare_at_price',
        'stock_quantity',
        'is_published',
        'photo',
        'color',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            // Generate a unique slug when one has not been provided.
            if (blank($product->slug) && filled($product->name)) {
                $product->slug = static::generateUniqueSlug($product->name);
            }

            // Generate a unique SKU when one has not been provided.
            if (blank($product->sku)) {
                $product->sku = static::generateUniqueSku();
            }
        });

        static::updating(function (Product $product) {
            // Generate a slug if it is missing.
            if (blank($product->slug) && filled($product->name)) {
                $product->slug = static::generateUniqueSlug(
                    $product->name,
                    $product->id
                );
            }

            // Generate an SKU if it is missing.
            if (blank($product->sku)) {
                $product->sku = static::generateUniqueSku();
            }
        });
    }

    /**
     * Generate a unique slug from the product name.
     */
    protected static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($name);

        // Use a fallback if the name contains no slug-compatible characters.
        if ($baseSlug === '') {
            $baseSlug = 'product';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (
            static::where('slug', $slug)
                ->when(
                    $ignoreId !== null,
                    fn ($query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter++;
        }

        return $slug;
    }

    /**
     * Generate a unique SKU.
     */
    protected static function generateUniqueSku(): string
    {
        do {
            $sku = 'ADR-' . strtoupper(Str::random(8));
        } while (static::where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * Product category relationship.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}