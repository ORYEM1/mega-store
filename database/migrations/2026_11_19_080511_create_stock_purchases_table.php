<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_purchases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('supplier_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('purchase_number')->unique();

            $table->string('invoice_number')->nullable();

            $table->date('purchase_date');

            $table->decimal('subtotal', 15, 2)->default(0);

            $table->decimal('transport_cost', 15, 2)->default(0);

            $table->decimal('other_costs', 15, 2)->default(0);

            $table->decimal('total_amount', 15, 2)->default(0);

            $table->decimal('amount_paid', 15, 2)->default(0);

            $table->decimal('balance', 15, 2)->default(0);

            $table->string('payment_method')->nullable();

            $table->string('payment_status', 30)->default('unpaid');

            $table->string('status', 30)->default('draft');

            $table->string('receipt')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('purchase_date');
            $table->index('payment_status');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_purchases');
    }
};