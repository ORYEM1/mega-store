<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('banners', 'collection')) {
            Schema::table('banners', function (Blueprint $table) {
                $table->string('collection')->default('all')->after('position');
            });
        }
    }

    public function down(): void
    {
        // Keep the existing collection column when rolling back.
    }
};