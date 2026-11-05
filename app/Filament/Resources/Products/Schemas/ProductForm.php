<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Models\Category;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\FileUpload;
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

                Section::make('Product Information')
                    ->schema([

                        // Product name
                        TextInput::make('name')
                            ->label('Product Name')
                            ->required()
                            ->maxLength(255)
                            ->live(onBlur: true)
                            ->afterStateUpdated(function ($state, callable $set) {
                                $set('slug', Str::slug($state));

                                // Generate SKU only if it has not been set.
                                $set(
                                    'sku',
                                    $state ? 'ADR-' . strtoupper(Str::random(8)) : null
                                );
                            }),

                        // Automatically generated slug
                        TextInput::make('slug')
                            ->label('Product Slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->readOnly(),

                        // Automatically generated SKU
                        TextInput::make('sku')
                            ->label('SKU')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->readOnly(),

                        // Category
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

                        // Optional color
                        TextInput::make('color')
                            ->label('Color')
                            ->placeholder('e.g. Black, White, Blue')
                            ->maxLength(100)
                            ->nullable(),

                        // Optional size
                        TextInput::make('size')
                            ->label('Size')
                            ->placeholder('e.g. S, M, L, XL or 42')
                            ->maxLength(100)
                            ->nullable(),

                        // Description
                        Textarea::make('description')
                            ->label('Product Description')
                            ->rows(4)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                // Product photo
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

                // Pricing and inventory
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
                            ->label('Available Stock')
                            ->required()
                            ->numeric()
                            ->integer()
                            ->minValue(0)
                            ->default(0),
                    ])
                    ->columns(3),

                // Publication
                Section::make('Publication')
                    ->schema([
                        Checkbox::make('is_published')
                            ->label('Publish this product')
                            ->default(false),
                    ]),

            ]);
    }
}