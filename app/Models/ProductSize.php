<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class ProductSize extends Model
{
    protected $fillable = [
        'product_id',
        'size',
        'stock_quantity',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
    ];

    /**
     * Clear cached products whenever a size changes.
     */
    protected static function booted(): void
    {
        static::saved(function (ProductSize $productSize) {
            Cache::store('redis')->forget('products:published:v1');
        });

        static::deleted(function (ProductSize $productSize) {
            Cache::store('redis')->forget('products:published:v1');
        });
    }

    /**
     * A size belongs to one product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}