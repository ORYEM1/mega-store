<?php

namespace App\Filament\Resources\Banners\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class BannersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                ImageColumn::make('image')
                    ->label('Banner')
                    ->disk('public')
                    ->square(),

                TextColumn::make('title')
                    ->label('Banner Title')
                    ->searchable()
                    ->sortable()
                    ->limit(35),

                TextColumn::make('position')
                    ->label('Position')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'hero' => 'success',
                        'promo' => 'info',
                        default => 'gray',
                    }),

                TextColumn::make('collection')
                    ->label('Collection')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'men' => 'Men',
                        'ladies' => 'Ladies',
                        'all' => 'All Collections',
                        default => 'Not Set',
                    })
                    ->color('gray'),

                TextColumn::make('product_level')
                    ->label('Product Level')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'affordable' => 'Affordable',
                        'executive' => 'Executive',
                        default => 'General',
                    })
                    ->color(fn (?string $state): string => match ($state) {
                        'affordable' => 'success',
                        'executive' => 'warning',
                        default => 'gray',
                    }),

                TextColumn::make('min_price')
                    ->label('Minimum Price')
                    ->formatStateUsing(fn ($state): string => filled($state)
                        ? 'UGX ' . number_format((float) $state)
                        : '—'
                    )
                    ->sortable(),

                TextColumn::make('max_price')
                    ->label('Maximum Price')
                    ->formatStateUsing(fn ($state): string => filled($state)
                        ? 'UGX ' . number_format((float) $state)
                        : '—'
                    )
                    ->sortable(),

                TextColumn::make('sort_order')
                    ->label('Order')
                    ->sortable(),

                ToggleColumn::make('is_active')
                    ->label('Active'),

                TextColumn::make('starts_at')
                    ->label('Starts')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('ends_at')
                    ->label('Ends')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

            ])

            ->defaultSort('sort_order')

            ->filters([

                SelectFilter::make('position')
                    ->label('Banner Position')
                    ->options([
                        'hero' => 'Hero Banner',
                        'promo' => 'Promotional Banner',
                    ]),

                SelectFilter::make('collection')
                    ->label('Collection')
                    ->options([
                        'all' => 'All Collections',
                        'men' => 'Men',
                        'ladies' => 'Ladies',
                    ]),

                SelectFilter::make('product_level')
                    ->label('Product Level')
                    ->options([
                        'affordable' => 'Affordable',
                        'executive' => 'Executive',
                    ]),

                TernaryFilter::make('is_active')
                    ->label('Active Status'),

            ])

            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])

            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}