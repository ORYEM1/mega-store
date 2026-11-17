<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Pages;

use App\Filament\Clusters\Sales\Resources\Sellers\SellerResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewSeller extends ViewRecord
{
    protected static string $resource = SellerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
