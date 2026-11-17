<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Models\Category;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                /*
                |--------------------------------------------------------------------------
                | Product Information
                |--------------------------------------------------------------------------
                */

                Section::make('Product Information')
                    ->schema([

                        TextInput::make('name')
                            ->label('Product Name')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function ($state, callable $set) {
                                $set('slug', Str::slug($state));

                                $set(
                                    'sku',
                                    $state
                                        ? 'ADR-' . strtoupper(Str::random(8))
                                        : null
                                );
                            }),

                        TextInput::make('slug')
                            ->label('Product Slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->readOnly(),

                        TextInput::make('sku')
                            ->label('SKU')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->readOnly(),

                        Select::make('category_id')
                            ->label('Category')
                            ->options(
                                Category::query()
                                    ->where('is_active', true)
                                    ->orderBy('name')
                                    ->pluck('name', 'id')
                            )
                            ->searchable()
                            ->preload()
                            ->nullable(),

                        TextInput::make('color')
                            ->label('Color')
                            ->placeholder('e.g. Black, White, Blue')
                            ->maxLength(100)
                            ->nullable(),

                        Textarea::make('description')
                            ->label('Product Description')
                            ->rows(4)
                            ->columnSpanFull(),

                    ])
                    ->columns(2),

                /*
                |--------------------------------------------------------------------------
                | Product Sizes
                |--------------------------------------------------------------------------
                */

                Section::make('Sizes and Stock')
                    ->description(
                        'Add sizes and their individual stock quantities. Leave this section empty for products without sizes.'
                    )
                    ->schema([

                        Repeater::make('sizes')
                            ->label('Available Sizes')
                            ->relationship()
                            ->schema([

                                TextInput::make('size')
                                    ->label('Size')
                                    ->placeholder('e.g. S, M, L, XL or 36')
                                    ->required()
                                    ->maxLength(50),

                                TextInput::make('stock_quantity')
                                    ->label('Stock Quantity')
                                    ->numeric()
                                    ->integer()
                                    ->required()
                                    ->minValue(0)
                                    ->default(0),

                            ])
                            ->columns(2)
                            ->defaultItems(0)
                            ->addActionLabel('Add Product Size')
                            ->reorderable(false)
                            ->collapsible()
                            ->itemLabel(
                                fn (array $state): ?string =>
                                    $state['size'] ?? 'New Size'
                            )
                            ->columnSpanFull(),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Product Photo
                |--------------------------------------------------------------------------
                */

                Section::make('Product Photo')
                    ->schema([

                        FileUpload::make('photo')
                            ->label('Upload Product Photo')
                            ->image()
                            ->disk('public')
                            ->directory('products')
                            ->visibility('public')
                            ->imageEditor()
                            ->maxSize(5120)
                            ->nullable()
                            ->helperText(
                                'Upload one product image. Maximum file size: 5 MB.'
                            ),

                    ]),

                /*
                |--------------------------------------------------------------------------
                | Pricing and Inventory
                |--------------------------------------------------------------------------
                */

                Section::make('Pricing and Inventory')
                    ->schema([

                        TextInput::make('price')
                            ->label('Selling Price (UGX)')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->prefix('UGX'),

                        TextInput::make('compare_at_price')
                            ->label('Previous Price (UGX)')
                            ->numeric()
                            ->minValue(0)
                            ->prefix('UGX')
                            ->nullable(),

                        TextInput::make('stock_quantity')
                            ->label('Available Stock (Products Without Sizes)')
                            ->required()
                            ->numeric()
                            ->integer()
                            ->minValue(0)
                            ->default(0)
                            ->helperText(
                                'Used for products that do not have size variations.'
                            ),

                    ])
                    ->columns(3),

                /*
                |--------------------------------------------------------------------------
                | Publication
                |--------------------------------------------------------------------------
                */

                Section::make('Publication')
                    ->schema([

                        Checkbox::make('is_published')
                            ->label('Publish this product')
                            ->default(false),

                    ]),

            ]);
    }
}