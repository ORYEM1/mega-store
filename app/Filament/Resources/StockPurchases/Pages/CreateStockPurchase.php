<?php

namespace App\Filament\Resources\StockPurchases\Pages;

use App\Filament\Resources\StockPurchases\StockPurchaseResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Auth;

class CreateStockPurchase extends CreateRecord
{
    protected static string $resource = StockPurchaseResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
       $data['user_id'] = Auth::id();
        $data['status'] = 'draft';

        return $data;
    }
}