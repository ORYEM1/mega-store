<?php

namespace App\Filament\Resources\StockPurchases;

use App\Filament\Resources\StockPurchases\Pages\CreateStockPurchase;
use App\Filament\Resources\StockPurchases\Pages\EditStockPurchase;
use App\Filament\Resources\StockPurchases\Pages\ListStockPurchases;
use App\Filament\Resources\StockPurchases\Schemas\StockPurchaseForm;
use App\Filament\Resources\StockPurchases\Tables\StockPurchasesTable;
use App\Models\StockPurchase;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class StockPurchaseResource extends Resource
{
    protected static ?string $model = StockPurchase::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShoppingCart;

    protected static ?string $recordTitleAttribute = 'purchase_number';

    public static function form(Schema $schema): Schema
    {
        return StockPurchaseForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return StockPurchasesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListStockPurchases::route('/'),
            'create' => CreateStockPurchase::route('/create'),
            'edit' => EditStockPurchase::route('/{record}/edit'),
        ];
    }
}
