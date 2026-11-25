<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Schemas;

use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SellerInfolist
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
                    ->icon('heroicon-o-user')
                    ->columns(2)
                    ->schema([

                        TextEntry::make('first_name')
                            ->label('First Name'),

                        TextEntry::make('middle_name')
                            ->label('Middle Name')
                            ->placeholder('Not provided'),

                        TextEntry::make('last_name')
                            ->label('Last Name'),

                        TextEntry::make('email')
                            ->label('Email Address')
                            ->copyable(),

                        TextEntry::make('phone')
                            ->label('Phone Number')
                            ->copyable(),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Business Information
                |--------------------------------------------------------------------------
                */

                Section::make('Business Information')
                    ->icon('heroicon-o-building-storefront')
                    ->columns(2)
                    ->schema([

                        ImageEntry::make('business_logo')
                            ->label('Business Logo')
                            ->disk('public')
                            ->height(100)
                            ->columnSpanFull(),

                        TextEntry::make('business_name')
                            ->label('Business Name'),

                        TextEntry::make('business_slug')
                            ->label('Business Slug')
                            ->copyable(),

                        TextEntry::make('business_description')
                            ->label('Business Description')
                            ->placeholder('No description provided')
                            ->columnSpanFull(),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Business Address
                |--------------------------------------------------------------------------
                */

                Section::make('Business Address')
                    ->icon('heroicon-o-map-pin')
                    ->columns(2)
                    ->schema([

                        TextEntry::make('address')
                            ->label('Street Address')
                            ->placeholder('Not provided')
                            ->columnSpanFull(),

                        TextEntry::make('city')
                            ->label('City')
                            ->placeholder('Not provided'),

                        TextEntry::make('state')
                            ->label('State / Region')
                            ->placeholder('Not provided'),

                        TextEntry::make('country')
                            ->label('Country')
                            ->placeholder('Not provided'),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Seller Approval
                |--------------------------------------------------------------------------
                */

                Section::make('Seller Application')
                    ->icon('heroicon-o-shield-check')
                    ->columns(2)
                    ->schema([

                        TextEntry::make('approval_status')
                            ->label('Application Status')
                            ->badge()
                            ->color(fn (?string $state): string => match ($state) {
                                'approved' => 'success',
                                'pending' => 'warning',
                                'rejected' => 'danger',
                                'suspended' => 'gray',
                                default => 'secondary',
                            }),

                        TextEntry::make('approved_at')
                            ->label('Approved On')
                            ->dateTime('d M Y, H:i')
                            ->placeholder('Not approved'),

                        TextEntry::make('rejection_reason')
                            ->label('Rejection Reason')
                            ->placeholder('No rejection reason')
                            ->columnSpanFull(),

                        TextEntry::make('created_at')
                            ->label('Registration Date')
                            ->dateTime('d M Y, H:i'),

                        TextEntry::make('updated_at')
                            ->label('Last Updated')
                            ->dateTime('d M Y, H:i'),

                    ]),

            ]);
    }
}