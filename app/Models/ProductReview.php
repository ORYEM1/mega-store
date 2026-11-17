<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'customer_id',
        'rating',
        'review',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (ProductReview $review) {
            Cache::store('redis')->forget('products:published:v1');
        });

        static::deleted(function (ProductReview $review) {
            Cache::store('redis')->forget('products:published:v1');
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}