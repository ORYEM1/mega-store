<?php

namespace App\Filament\Resources\Suppliers\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SupplierForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                Section::make('Supplier Information')
                    ->description('Basic supplier and company details.')
                    ->schema([

                        TextInput::make('name')
                            ->label('Supplier Name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Enter supplier name'),

                        TextInput::make('company_name')
                            ->label('Company Name')
                            ->maxLength(255)
                            ->placeholder('Enter company name'),

                        TextInput::make('contact_person')
                            ->label('Contact Person')
                            ->maxLength(255)
                            ->placeholder('Enter contact person'),

                    ])
                    ->columns(2),

                Section::make('Contact Information')
                    ->schema([

                        TextInput::make('phone')
                            ->label('Phone Number')
                            ->tel()
                            ->maxLength(30)
                            ->placeholder('+256...'),

                        TextInput::make('email')
                            ->label('Email Address')
                            ->email()
                            ->maxLength(255)
                            ->placeholder('supplier@example.com'),

                        Textarea::make('address')
                            ->label('Physical Address')
                            ->rows(3)
                            ->columnSpanFull(),

                    ])
                    ->columns(2),

                Section::make('Additional Information')
                    ->schema([

                        Textarea::make('notes')
                            ->label('Notes')
                            ->rows(4)
                            ->columnSpanFull(),

                        Toggle::make('is_active')
                            ->label('Active Supplier')
                            ->default(true)
                            ->helperText('Inactive suppliers will not be available for new purchases.'),

                    ])
                    ->columns(2),

            ]);
    }
}