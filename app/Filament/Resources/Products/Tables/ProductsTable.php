<?php

namespace App\Filament\Resources\Products\Tables;

use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                // Product photo
                ImageColumn::make('photo')
                    ->label('Photo')
                    ->disk('public')
                    ->square()
                    ->size(60),

                // Product name
                TextColumn::make('name')
                    ->label('Product Name')
                    ->searchable()
                    ->sortable(),

                // Stock keeping unit
                TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->sortable(),

                // Product category
                TextColumn::make('category.name')
                    ->label('Category')
                    ->placeholder('No category')
                    ->sortable(),

                // Product color (optional)
                TextColumn::make('color')
                    ->label('Color')
                    ->placeholder('—')
                    ->searchable()
                    ->sortable(),

                // Product size (optional)
                TextColumn::make('size')
                    ->label('Size')
                    ->placeholder('—')
                    ->searchable()
                    ->sortable(),

                // Selling price
                TextColumn::make('price')
                    ->label('Price')
                    ->formatStateUsing(
                        fn ($state) => 'UGX ' . number_format((float) $state, 0)
                    )
                    ->sortable(),

                // Available stock
                TextColumn::make('stock_quantity')
                    ->label('Stock')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color(
                        fn ($state) => $state > 0 ? 'success' : 'danger'
                    ),

                // Publication status
                IconColumn::make('is_published')
                    ->label('Published')
                    ->boolean(),

            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}