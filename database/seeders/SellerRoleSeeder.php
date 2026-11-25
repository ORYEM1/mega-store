<?php

namespace Database\Seeders;

use App\Models\Seller;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SellerRoleSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);

        $registrar->forgetCachedPermissions();

        $rolePermissions = [

            'Manager' => [
                'products.view',
                'products.create',
                'products.update',
                'products.delete',
                'inventory.view',
                'inventory.manage',
                'orders.view',
                'orders.manage',
                'staff.view',
                'staff.create',
                'staff.update',
                'staff.delete',
                'reports.view',
            ],

            'Inventory Manager' => [
                'products.view',
                'products.update',
                'inventory.view',
                'inventory.manage',
            ],

            'Sales Attendant' => [
                'products.view',
                'inventory.view',
                'orders.view',
                'orders.manage',
            ],

            'Stock Manager' => [
                'products.view',
                'inventory.view',
                'inventory.manage',
            ],
        ];

        foreach (Seller::all() as $seller) {

            // Set the current seller's permission team.
            $registrar->setPermissionsTeamId($seller->id);

            foreach ($rolePermissions as $roleName => $permissions) {

                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'seller_staff',
                ]);

                $role->syncPermissions($permissions);
            }
        }

        // Clear the team context after seeding.
        $registrar->setPermissionsTeamId(null);

        $registrar->forgetCachedPermissions();
    }
}