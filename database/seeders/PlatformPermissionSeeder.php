<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PlatformPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);

        // Platform roles use the global team context.
        $registrar->setPermissionsTeamId(null);

        /*
        |--------------------------------------------------------------------------
        | Define platform permissions
        |--------------------------------------------------------------------------
        */

        $resourcePermissions = [
            'categories' => ['view', 'create', 'update', 'delete'],
            'products' => ['view', 'create', 'update', 'delete'],
            'orders' => ['view', 'update'],
            'order_items' => ['view'],
            'customers' => ['view', 'create', 'update', 'delete'],
            'banners' => ['view', 'create', 'update', 'delete'],
            'suppliers' => ['view', 'create', 'update', 'delete'],
            'stock_purchases' => ['view', 'create', 'update', 'delete'],
            'stock_movements' => ['view', 'create', 'update'],
            'seller_staff' => ['view', 'create', 'update', 'delete'],
            'chat_conversations' => ['view', 'update'],
            'users' => ['view', 'create', 'update', 'delete'],
        ];

        $allPermissions = [
            'dashboard.view',
            'platform.roles.manage',
        ];

        foreach ($resourcePermissions as $resource => $actions) {
            foreach ($actions as $action) {
                $allPermissions[] = "{$resource}.{$action}";
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Create permissions
        |--------------------------------------------------------------------------
        */

        foreach ($allPermissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Define role permissions
        |--------------------------------------------------------------------------
        */

        $rolePermissions = [

            // Full platform access.
            'super_admin' => $allPermissions,

            // General platform administration, excluding platform user management.
            'Admin' => array_values(array_filter(
                $allPermissions,
                fn ($permission) => ! str_starts_with($permission, 'users.')
                    && $permission !== 'platform.roles.manage'
            )),

            // Operations and stock management.
            'Operations Manager' => [
                'dashboard.view',
                'products.view',
                'products.update',
                'orders.view',
                'orders.update',
                'suppliers.view',
                'suppliers.create',
                'suppliers.update',
                'stock_purchases.view',
                'stock_purchases.create',
                'stock_purchases.update',
                'stock_movements.view',
                'stock_movements.create',
                'stock_movements.update',
                'seller_staff.view',
                'seller_staff.create',
                'seller_staff.update',
                'chat_conversations.view',
            ],

            // Finance and purchasing oversight.
            'Finance Manager' => [
                'dashboard.view',
                'orders.view',
                'order_items.view',
                'customers.view',
                'suppliers.view',
                'stock_purchases.view',
                'stock_movements.view',
            ],

            // Customer service and communication.
            'Customer Support' => [
                'dashboard.view',
                'customers.view',
                'customers.update',
                'orders.view',
                'orders.update',
                'chat_conversations.view',
                'chat_conversations.update',
            ],

            // Website content management.
            'Content Manager' => [
                'dashboard.view',
                'categories.view',
                'categories.create',
                'categories.update',
                'categories.delete',
                'products.view',
                'products.create',
                'products.update',
                'banners.view',
                'banners.create',
                'banners.update',
                'banners.delete',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Assign permissions to roles
        |--------------------------------------------------------------------------
        */

        foreach ($rolePermissions as $roleName => $permissions) {

    // Create the platform role if it does not exist.
             $role = Role::firstOrCreate([
                 'name' => $roleName,
                 'guard_name' => 'web',
                 'seller_id' => null,
             ]);

            $permissionModels = Permission::query()
                ->where('guard_name', 'web')
                ->whereIn('name', $permissions)
                ->get();

            $role->syncPermissions($permissionModels);
        }

        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId(null);
    }
}