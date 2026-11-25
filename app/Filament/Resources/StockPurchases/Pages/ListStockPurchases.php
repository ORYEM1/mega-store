<?php

namespace App\Filament\Resources\StockPurchases\Pages;

use App\Filament\Resources\StockPurchases\StockPurchaseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListStockPurchases extends ListRecords
{
    protected static string $resource = StockPurchaseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
