<?php

namespace App\Filament\Resources\StockPurchases\Pages;

use App\Filament\Resources\StockPurchases\StockPurchaseResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Validation\ValidationException;

class EditStockPurchase extends EditRecord
{
    protected static string $resource = StockPurchaseResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if ($this->record->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only draft purchases can be edited.',
            ]);
        }

        return $data;
    }

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make()
                ->visible(fn () => $this->record->status === 'draft'),
        ];
    }
}