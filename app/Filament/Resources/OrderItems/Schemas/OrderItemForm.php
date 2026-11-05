<?php

namespace App\Filament\Resources\OrderItems\Schemas;

use App\Models\Order;
use App\Models\Product;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OrderItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Order Item Details')
                    ->description('Select an order and product, then enter the quantity and price.')
                    ->schema([
                        Select::make('order_id')
                            ->label('Order')
                            ->relationship(
                                name: 'order',
                                titleAttribute: 'order_number'
                            )
                            ->searchable()
                            ->preload()
                            ->required(),

                        Select::make('product_id')
                            ->label('Product')
                            ->relationship(
                                name: 'product',
                                titleAttribute: 'name'
                            )
                            ->searchable()
                            ->preload()
                            ->required()
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set) {
                                $product = Product::find($state);

                                if ($product) {
                                    $set('unit_price', $product->price);
                                }
                            }),

                        TextInput::make('quantity')
                            ->label('Quantity')
                            ->numeric()
                            ->integer()
                            ->minValue(1)
                            ->required()
                            ->default(1)
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                $quantity = (int) ($state ?? 0);
                                $unitPrice = (float) ($get('unit_price') ?? 0);

                                $set('subtotal', number_format(
                                    $quantity * $unitPrice,
                                    2,
                                    '.',
                                    ''
                                ));
                            }),

                        TextInput::make('unit_price')
                            ->label('Unit Price (UGX)')
                            ->numeric()
                            ->minValue(0)
                            ->required()
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                $quantity = (int) ($get('quantity') ?? 0);
                                $unitPrice = (float) ($state ?? 0);

                                $set('subtotal', number_format(
                                    $quantity * $unitPrice,
                                    2,
                                    '.',
                                    ''
                                ));
                            }),

                        TextInput::make('subtotal')
                            ->label('Subtotal (UGX)')
                            ->numeric()
                            ->required()
                            ->readOnly()
                            ->dehydrated(),
                    ])
                    ->columns(2),
            ]);
    }
}