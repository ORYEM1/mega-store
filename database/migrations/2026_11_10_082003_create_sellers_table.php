<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();

            // Seller personal information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('phone')->nullable()->unique();
            $table->string('email')->unique();
            $table->string('password');

            // Business information
            $table->string('business_name');
            $table->string('business_slug')->unique();
            $table->text('business_description')->nullable();
            $table->string('business_logo')->nullable();

            // Address information
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('Uganda');

            // Seller approval
            $table->string('approval_status')->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->rememberToken();

            $table->timestamps();

            // Indexes
            $table->index('approval_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sellers');
    }
};