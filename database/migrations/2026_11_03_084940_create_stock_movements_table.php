<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('stock_movements', function (Blueprint $table) {
        $table->id();

        // The product whose stock changed
        $table->foreignId('product_id')
            ->constrained()
            ->restrictOnDelete();

        // The admin who performed the movement
        $table->foreignId('user_id')
            ->nullable()
            ->constrained()
            ->nullOnDelete();

        // purchase, sale, return, adjustment, cancellation
        $table->string('type', 30);

        // Positive = stock added; negative = stock removed
        $table->integer('quantity');

        // Stock levels before and after the movement
        $table->unsignedInteger('quantity_before');
        $table->unsignedInteger('quantity_after');

        $table->string('reference')->nullable();
        $table->text('notes')->nullable();

        $table->timestamps();

        $table->index(['product_id', 'created_at']);
        $table->index('type');
    });
}

public function down(): void
{
    Schema::dropIfExists('stock_movements');
}
};
