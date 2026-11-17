<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Pages;

use App\Filament\Clusters\Sales\Resources\Sellers\SellerResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSellers extends ListRecords
{
    protected static string $resource = SellerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
