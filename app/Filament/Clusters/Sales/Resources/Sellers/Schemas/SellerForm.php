<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;

class SellerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                /*
                |--------------------------------------------------------------------------
                | Personal Information
                |--------------------------------------------------------------------------
                */

                Section::make('Personal Information')
                    ->description('Seller contact and personal details.')
                    ->icon('heroicon-o-user')
                    ->columns(2)
                    ->schema([

                        TextInput::make('first_name')
                            ->label('First Name')
                            ->required()
                            ->maxLength(255),

                        TextInput::make('last_name')
                            ->label('Last Name')
                            ->required()
                            ->maxLength(255),

                        TextInput::make('middle_name')
                            ->label('Middle Name')
                            ->maxLength(255),

                        TextInput::make('email')
                            ->label('Email Address')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),

                        TextInput::make('phone')
                            ->label('Phone Number')
                            ->tel()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(30),

                        TextInput::make('password')
                            ->label('Password')
                            ->password()
                            ->revealable()
                            ->minLength(8)
                            ->dehydrated(fn ($state): bool => filled($state))
                            ->dehydrateStateUsing(fn ($state): string => Hash::make($state))
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->helperText('Leave blank when editing to keep the current password.'),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Business Information
                |--------------------------------------------------------------------------
                */

                Section::make('Business Information')
                    ->description('Information about the seller business.')
                    ->icon('heroicon-o-building-storefront')
                    ->columns(2)
                    ->schema([

                        TextInput::make('business_name')
                            ->label('Business Name')
                            ->required()
                            ->maxLength(255),

                        TextInput::make('business_slug')
                            ->label('Business Slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),

                        Textarea::make('business_description')
                            ->label('Business Description')
                            ->rows(4)
                            ->columnSpanFull(),

                        FileUpload::make('business_logo')
                            ->label('Business Logo')
                            ->image()
                            ->disk('public')
                            ->directory('sellers/logos')
                            ->imageEditor()
                            ->maxSize(2048)
                            ->columnSpanFull(),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Business Address
                |--------------------------------------------------------------------------
                */

                Section::make('Business Address')
                    ->description('Seller business location.')
                    ->icon('heroicon-o-map-pin')
                    ->columns(2)
                    ->schema([

                        TextInput::make('address')
                            ->label('Street Address')
                            ->maxLength(255)
                            ->columnSpanFull(),

                        TextInput::make('city')
                            ->label('City')
                            ->maxLength(255),

                        TextInput::make('state')
                            ->label('State / Region')
                            ->maxLength(255),

                        TextInput::make('country')
                            ->label('Country')
                            ->default('Uganda')
                            ->maxLength(255),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Seller Approval
                |--------------------------------------------------------------------------
                */

                Section::make('Seller Approval')
                    ->description('Manage the seller application and account status.')
                    ->icon('heroicon-o-shield-check')
                    ->columns(2)
                    ->schema([

                        Select::make('approval_status')
                            ->label('Approval Status')
                            ->options([
                                'pending' => 'Pending',
                                'approved' => 'Approved',
                                'rejected' => 'Rejected',
                                'suspended' => 'Suspended',
                            ])
                            ->default('pending')
                            ->required()
                            ->native(false),

                        DateTimePicker::make('approved_at')
                            ->label('Approval Date')
                            ->seconds(false)
                            ->disabled()
                            ->dehydrated(),

                        Textarea::make('rejection_reason')
                            ->label('Rejection Reason')
                            ->rows(3)
                            ->maxLength(1000)
                            ->columnSpanFull()
                            ->visible(fn ($get): bool =>
                                $get('approval_status') === 'rejected'
                            ),

                    ]),

            ]);
    }
}