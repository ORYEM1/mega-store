<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Pages;

use App\Filament\Clusters\Sales\Resources\Sellers\SellerResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditSeller extends EditRecord
{
    protected static string $resource = SellerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
