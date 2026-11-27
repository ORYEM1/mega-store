<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        $roleName = $data['role'] ?? null;

        unset($data['role']);

        $user = static::getModel()::create($data);

        if ($roleName) {
            $role = Role::query()
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->whereNull('seller_id')
                ->firstOrFail();

            app(PermissionRegistrar::class)
                ->setPermissionsTeamId(null);

            $user->assignRole($role);
        }

        return $user;
    }
}