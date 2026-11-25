<?php

namespace App\Filament\Resources\StockPurchases\Schemas;

use App\Models\Product;
use App\Models\ProductSize;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class StockPurchaseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                Section::make('Purchase Information')
                    ->schema([

                        TextInput::make('purchase_number')
                            ->label('Purchase Number')
                            ->default(fn () => 'PUR-' . strtoupper(Str::random(8)))
                            ->required()
                            ->readOnly()
                            ->dehydrated(),

                        Select::make('supplier_id')
                            ->label('Supplier')
                            ->relationship(
                                name: 'supplier',
                                titleAttribute: 'name'
                            )
                            ->searchable()
                            ->preload()
                            ->nullable(),

                        DatePicker::make('purchase_date')
                            ->label('Purchase Date')
                            ->default(now())
                            ->required(),

                        TextInput::make('invoice_number')
                            ->label('Supplier Invoice Number')
                            ->maxLength(255)
                            ->nullable(),

                    ])
                    ->columns(2),

                Section::make('Purchased Products')
                    ->description('Add each product purchased from the supplier.')
                    ->schema([

                        Repeater::make('items')
                            ->relationship()
                            ->schema([

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
                                        $set('product_size_id', null);
                                    }),

                                Select::make('product_size_id')
                                    ->label('Product Size')
                                    ->options(function (callable $get) {
                                        $productId = $get('product_id');

                                        if (!$productId) {
                                            return [];
                                        }

                                        return ProductSize::query()
                                            ->where('product_id', $productId)
                                            ->orderBy('size')
                                            ->pluck('size', 'id')
                                            ->toArray();
                                    })
                                    ->visible(function (callable $get) {
                                        $productId = $get('product_id');

                                        return $productId
                                            && ProductSize::where('product_id', $productId)->exists();
                                    })
                                    ->required(function (callable $get) {
                                        $productId = $get('product_id');

                                        return $productId
                                            && ProductSize::where('product_id', $productId)->exists();
                                    })
                                    ->searchable()
                                    ->live()
                                    ->placeholder('Select size'),

                                TextInput::make('quantity')
                                    ->label('Quantity')
                                    ->numeric()
                                    ->integer()
                                    ->minValue(1)
                                    ->default(1)
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                        $quantity = (int) ($state ?? 0);
                                        $unitCost = (float) ($get('unit_cost') ?? 0);

                                        $set('line_total', number_format(
                                            $quantity * $unitCost,
                                            2,
                                            '.',
                                            ''
                                        ));
                                    }),

                                TextInput::make('unit_cost')
                                    ->label('Buying Price per Unit (UGX)')
                                    ->numeric()
                                    ->minValue(0)
                                    ->default(0)
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                        $quantity = (int) ($get('quantity') ?? 0);
                                        $unitCost = (float) ($state ?? 0);

                                        $set('line_total', number_format(
                                            $quantity * $unitCost,
                                            2,
                                            '.',
                                            ''
                                        ));
                                    }),

                                TextInput::make('line_total')
                                    ->label('Line Total (UGX)')
                                    ->numeric()
                                    ->readOnly()
                                    ->dehydrated()
                                    ->default(0),

                            ])
                            ->columns(2)
                            ->defaultItems(1)
                            ->minItems(1)
                            ->addActionLabel('Add Another Product')
                            ->reorderable(false)
                            ->collapsible()
                            ->columnSpanFull()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                $subtotal = collect($state ?? [])
                                    ->sum(function ($item) {
                                        return (int) ($item['quantity'] ?? 0)
                                            * (float) ($item['unit_cost'] ?? 0);
                                    });

                                $set('subtotal', number_format($subtotal, 2, '.', ''));

                                self::updateFinancials($set, $get);
                            }),

                    ]),

                Section::make('Purchase Expenses')
                    ->description('Add transport, loading, or other expenses related to this purchase.')
                    ->schema([

                        TextInput::make('subtotal')
                            ->label('Products Subtotal (UGX)')
                            ->numeric()
                            ->default(0)
                            ->readOnly()
                            ->dehydrated(),

                        TextInput::make('transport_cost')
                            ->label('Transport Cost (UGX)')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                self::updateFinancials($set, $get);
                            }),

                        TextInput::make('other_costs')
                            ->label('Other Expenses (UGX)')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                self::updateFinancials($set, $get);
                            }),

                        TextInput::make('total_amount')
                            ->label('Total Purchase Cost (UGX)')
                            ->numeric()
                            ->default(0)
                            ->readOnly()
                            ->dehydrated(),

                    ])
                    ->columns(2),

                Section::make('Payment Information')
                    ->schema([

                        TextInput::make('amount_paid')
                            ->label('Amount Paid (UGX)')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                self::updateFinancials($set, $get);
                            }),

                        TextInput::make('balance')
                            ->label('Outstanding Balance (UGX)')
                            ->numeric()
                            ->default(0)
                            ->readOnly()
                            ->dehydrated(),

                        TextInput::make('payment_method')
                            ->label('Payment Method')
                            ->placeholder('Cash, Mobile Money, Bank, etc.')
                            ->maxLength(100)
                            ->nullable(),

                        TextInput::make('payment_status')
                            ->label('Payment Status')
                            ->default('unpaid')
                            ->readOnly()
                            ->dehydrated(),

                    ])
                    ->columns(2),

                Section::make('Receipt and Notes')
                    ->schema([

                        FileUpload::make('receipt')
                            ->label('Purchase Receipt')
                            ->disk('public')
                            ->directory('stock-purchases')
                            ->visibility('public')
                            ->acceptedFileTypes([
                                'image/*',
                                'application/pdf',
                            ])
                            ->maxSize(5120)
                            ->nullable(),

                        Textarea::make('notes')
                            ->label('Purchase Notes')
                            ->rows(4)
                            ->columnSpanFull(),

                    ]),

                Hidden::make('status')
                    ->default('draft'),

            ]);
    }

    private static function updateFinancials(
        callable $set,
        callable $get
    ): void {
        $subtotal = (float) ($get('subtotal') ?? 0);
        $transport = (float) ($get('transport_cost') ?? 0);
        $otherCosts = (float) ($get('other_costs') ?? 0);
        $amountPaid = (float) ($get('amount_paid') ?? 0);

        $total = $subtotal + $transport + $otherCosts;
        $balance = max(0, $total - $amountPaid);

        $set('total_amount', number_format($total, 2, '.', ''));
        $set('balance', number_format($balance, 2, '.', ''));

        if ($amountPaid <= 0) {
            $paymentStatus = 'unpaid';
        } elseif ($amountPaid < $total) {
            $paymentStatus = 'partial';
        } else {
            $paymentStatus = 'paid';
        }

        $set('payment_status', $paymentStatus);
    }
}