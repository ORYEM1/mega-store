<?php

namespace App\Filament\Resources\Users;

use App\Filament\Resources\Users\Pages\CreateUser;
use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Filament\Resources\Users\Schemas\UserForm;
use App\Filament\Resources\Users\Tables\UsersTable;
use App\Models\User;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|BackedEnum|null $navigationIcon =
        Heroicon::OutlinedUsers;

    protected static ?string $navigationLabel = 'Platform Users';

    protected static ?string $modelLabel = 'Platform User';

    protected static ?string $pluralModelLabel = 'Platform Users';

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return UserForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return UsersTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    /**
     * Only Super Admins can view platform users.
     */
    public static function canViewAny(): bool
    {
        $user = auth('web')->user();

        return $user !== null
            && (bool) call_user_func([$user, 'hasRole'], 'super_admin');
    }

    public static function canCreate(): bool
    {
        return static::canViewAny();
    }

    public static function canEdit(Model $record): bool
    {
        return static::canViewAny()
            && ! $record->hasRole('super_admin');
    }

    public static function canDelete(Model $record): bool
    {
        return static::canViewAny()
            && ! $record->hasRole('super_admin')
            && $record->id !== auth('web')->id();
    }

    /**
     * Disable bulk deletion to protect administrator accounts.
     */
    public static function canDeleteAny(): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListUsers::route('/'),
            'create' => CreateUser::route('/create'),
            'edit' => EditUser::route('/{record}/edit'),
        ];
    }
}