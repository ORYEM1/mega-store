<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Pages;

use App\Filament\Clusters\Sales\Resources\Sellers\SellerResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSeller extends CreateRecord
{
    protected static string $resource = SellerResource::class;
}
