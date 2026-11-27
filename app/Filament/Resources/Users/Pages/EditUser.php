<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $user = $this->record;

        app(PermissionRegistrar::class)
            ->setPermissionsTeamId(null);

        $data['role'] = $user->roles()
            ->where('guard_name', 'web')
            ->whereNull('roles.seller_id')
            ->value('name');

        return $data;
    }

    protected function handleRecordUpdate(
        Model $record,
        array $data
    ): Model {
        $roleName = $data['role'] ?? null;

        unset($data['role']);

        $record->update($data);

        if ($roleName) {
            $role = Role::query()
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->whereNull('seller_id')
                ->firstOrFail();

            app(PermissionRegistrar::class)
                ->setPermissionsTeamId(null);

            $record->syncRoles([$role]);
        }

        return $record;
    }

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make()
                ->visible(fn (): bool => $this->record->id !== auth('web')->id()
                    && ! $this->record->hasRole('super_admin')),
        ];
    }
}