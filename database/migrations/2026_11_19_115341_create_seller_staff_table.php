<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_staff', function (Blueprint $table) {
            $table->id();

            // Business owner this employee belongs to.
            $table->foreignId('seller_id')
                ->constrained('sellers')
                ->cascadeOnDelete();

            // Employee information.
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();

            // Login credentials.
            $table->string('password');

            // Owner can deactivate an employee without deleting the account.
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['seller_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_staff');
    }
};
