<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class SellerPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear cached permissions.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [

            // Products
            'products.view',
            'products.create',
            'products.update',
            'products.delete',

            // Inventory
            'inventory.view',
            'inventory.manage',

            // Orders
            'orders.view',
            'orders.manage',

            // Staff
            'staff.view',
            'staff.create',
            'staff.update',
            'staff.delete',

            // Reports
            'reports.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'seller_staff',
            ]);
        }

        // Clear cache again after creating permissions.
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}