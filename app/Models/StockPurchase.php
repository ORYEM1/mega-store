<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockPurchase extends Model
{
    protected $fillable = [
        'supplier_id',
        'user_id',
        'purchase_number',
        'invoice_number',
        'purchase_date',
        'subtotal',
        'transport_cost',
        'other_costs',
        'total_amount',
        'amount_paid',
        'balance',
        'payment_method',
        'payment_status',
        'status',
        'receipt',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'subtotal' => 'decimal:2',
            'transport_cost' => 'decimal:2',
            'other_costs' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockPurchaseItem::class);
    }
}