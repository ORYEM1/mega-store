<?php

namespace App\Services;

use App\Models\Seller;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SellerRoleService
{
    public function initializeDefaultRoles(Seller $seller): void
    {
        $registrar = app(PermissionRegistrar::class);

        $registrar->forgetCachedPermissions();

        $permissions = [
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
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'seller_staff',
            ]);
        }

        $registrar->setPermissionsTeamId($seller->id);

        try {
            $rolePermissions = [
                'Manager' => $permissions,

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

            foreach ($rolePermissions as $roleName => $assignedPermissions) {
                $role = Role::firstOrCreate([
                    'seller_id' => $seller->id,
                    'name' => $roleName,
                    'guard_name' => 'seller_staff',
                ]);

                if ($role->wasRecentlyCreated) {
                    $role->syncPermissions($assignedPermissions);
                }
            }
        } finally {
            $registrar->setPermissionsTeamId(null);
            $registrar->forgetCachedPermissions();
        }
    }
}