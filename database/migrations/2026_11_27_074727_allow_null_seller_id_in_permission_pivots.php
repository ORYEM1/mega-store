<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Allow platform roles without a seller.
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropPrimary();

            $table->unsignedBigInteger('seller_id')
                ->nullable()
                ->change();

            $table->unique(
                ['seller_id', 'role_id', 'model_id', 'model_type'],
                'model_has_roles_unique'
            );
        });

        // Allow direct platform permissions without a seller.
        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropPrimary();

            $table->unsignedBigInteger('seller_id')
                ->nullable()
                ->change();

            $table->unique(
                ['seller_id', 'permission_id', 'model_id', 'model_type'],
                'model_has_permissions_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropUnique('model_has_roles_unique');
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropUnique('model_has_permissions_unique');
        });

        // Convert global assignments before restoring NOT NULL.
        DB::table('model_has_roles')
            ->whereNull('seller_id')
            ->update(['seller_id' => 0]);

        DB::table('model_has_permissions')
            ->whereNull('seller_id')
            ->update(['seller_id' => 0]);

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('seller_id')
                ->nullable(false)
                ->change();

            $table->primary([
                'seller_id',
                'role_id',
                'model_id',
                'model_type',
            ]);
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('seller_id')
                ->nullable(false)
                ->change();

            $table->primary([
                'seller_id',
                'permission_id',
                'model_id',
                'model_type',
            ]);
        });
    }
};