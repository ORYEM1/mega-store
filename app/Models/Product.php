<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class Product extends Model
{
    public const LEVEL_AFFORDABLE = 'affordable';

    public const LEVEL_EXECUTIVE = 'executive';

    public const EXECUTIVE_CATEGORIES = [
        'premium' => 'Premium',
        'luxury' => 'Luxury',
        'designer' => 'Designer',
        'exclusive' => 'Exclusive',
    ];

    protected $fillable = [
        'seller_id',
        'category_id',
        'product_level',
        'executive_category',
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
            'seller_id' => 'integer',
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (blank($product->slug) && filled($product->name)) {
                $product->slug = static::generateUniqueSlug($product->name);
            }

            if (blank($product->sku)) {
                $product->sku = static::generateUniqueSku();
            }

            if (blank($product->product_level)) {
                $product->product_level = self::LEVEL_AFFORDABLE;
            }

            if ($product->product_level !== self::LEVEL_EXECUTIVE) {
                $product->executive_category = null;
            }
        });

        static::updating(function (Product $product) {
            if (blank($product->slug) && filled($product->name)) {
                $product->slug = static::generateUniqueSlug(
                    $product->name,
                    $product->id
                );
            }

            if (blank($product->sku)) {
                $product->sku = static::generateUniqueSku();
            }

            if ($product->product_level !== self::LEVEL_EXECUTIVE) {
                $product->executive_category = null;
            }
        });

        static::saved(function (Product $product) {
            Cache::store('redis')->forget('products:published:v1');
        });

        static::deleted(function (Product $product) {
            Cache::store('redis')->forget('products:published:v1');
        });
    }

    protected static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($name);

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

    protected static function generateUniqueSku(): string
    {
        do {
            $sku = 'ADR-' . strtoupper(Str::random(8));
        } while (static::where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * Get the seller who owns this product.
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function sizes(): HasMany
    {
        return $this->hasMany(ProductSize::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    /**
     * Scope: Affordable products.
     */
    public function scopeAffordable($query)
    {
        return $query->where('product_level', self::LEVEL_AFFORDABLE);
    }

    /**
     * Scope: Executive products.
     */
    public function scopeExecutive($query)
    {
        return $query->where('product_level', self::LEVEL_EXECUTIVE);
    }

    /**
     * Scope: Products in a specific executive category.
     */
    public function scopeExecutiveCategory($query, string $category)
    {
        return $query
            ->where('product_level', self::LEVEL_EXECUTIVE)
            ->where('executive_category', $category);
    }
}