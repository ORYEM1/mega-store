<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {

            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders', 'orders_id')
                ->cascadeOnDelete();

            $table->string('provider');

            $table->string('external_id')->unique();

            $table->string('reference_id')->nullable()->unique();

            $table->string('phone_number');

            $table->decimal('amount', 12, 2);

            $table->string('currency', 3);

            $table->string('status')->default('pending');

            $table->json('provider_response')->nullable();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'status']);

            $table->index(['provider', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};