<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Connect products to sellers
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('seller_id')
                ->nullable()
                ->after('category_id')
                ->constrained('sellers')
                ->nullOnDelete();

            $table->index('seller_id');
        });

        // Record which seller owns each purchased item
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('seller_id')
                ->nullable()
                ->after('product_id')
                ->constrained('sellers')
                ->nullOnDelete();

            $table->index('seller_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['seller_id']);
            $table->dropIndex(['seller_id']);
            $table->dropColumn('seller_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['seller_id']);
            $table->dropIndex(['seller_id']);
            $table->dropColumn('seller_id');
        });
    }
};