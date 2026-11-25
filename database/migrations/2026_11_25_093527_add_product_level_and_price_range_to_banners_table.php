<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('product_level')->nullable()->after('collection');
            $table->unsignedBigInteger('min_price')->nullable()->after('product_level');
            $table->unsignedBigInteger('max_price')->nullable()->after('min_price');
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn([
                'product_level',
                'min_price',
                'max_price',
            ]);
        });
    }
};