<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_purchase_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stock_purchase_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('product_size_id')
                ->nullable()
                ->constrained('product_sizes')
                ->nullOnDelete();

            $table->unsignedInteger('quantity');

            $table->decimal('unit_cost', 15, 2);

            $table->decimal('line_total', 15, 2);

            $table->timestamps();

            $table->index('product_id');
            $table->index('product_size_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_purchase_items');
    }
};