<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                Section::make('User Information')
                    ->description('Enter the platform administrator details.')
                    ->schema([

                        TextInput::make('name')
                            ->label('Full Name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Enter full name'),

                        TextInput::make('email')
                            ->label('Email Address')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('admin@example.com'),

                    ])
                    ->columns(2),

                Section::make('Account Security')
                    ->schema([

                        TextInput::make('password')
                            ->label('Password')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->rule(Password::min(8))
                            ->dehydrated(fn ($state): bool => filled($state))
                            ->dehydrateStateUsing(fn ($state) => $state),

                        TextInput::make('password_confirmation')
                            ->label('Confirm Password')
                            ->password()
                            ->revealable()
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->same('password')
                            ->dehydrated(false),

                    ])
                    ->columns(2),

                Section::make('Platform Role')
                    ->description('Choose the access level for this account.')
                    ->schema([

                        Select::make('role')
                            ->label('Assign Role')
                            ->options(fn () => Role::query()
                                ->where('guard_name', 'web')
                                ->whereNull('seller_id')
                                ->pluck('name', 'name'))
                            ->required()
                            ->searchable()
                            ->preload()
                            ->dehydrated(false)
                            ->helperText('Only platform roles are displayed.'),

                    ]),

            ]);
    }
}