<?php

namespace App\Filament\Resources\StockPurchases\Tables;

use App\Models\StockPurchase;
use App\Services\Stock\StockPurchaseService;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;

class StockPurchasesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                TextColumn::make('purchase_number')
                    ->label('Purchase No.')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                TextColumn::make('supplier.name')
                    ->label('Supplier')
                    ->searchable()
                    ->placeholder('No supplier'),

                TextColumn::make('purchase_date')
                    ->label('Purchase Date')
                    ->date('d M Y')
                    ->sortable(),

                TextColumn::make('total_amount')
                    ->label('Total Cost')
                    ->formatStateUsing(
                        fn ($state) => 'UGX ' . number_format((float) $state)
                    )
                    ->sortable(),

                TextColumn::make('amount_paid')
                    ->label('Amount Paid')
                    ->formatStateUsing(
                        fn ($state) => 'UGX ' . number_format((float) $state)
                    )
                    ->sortable(),

                TextColumn::make('balance')
                    ->label('Balance')
                    ->formatStateUsing(
                        fn ($state) => 'UGX ' . number_format((float) $state)
                    )
                    ->sortable(),

                TextColumn::make('payment_status')
                    ->label('Payment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'partial' => 'warning',
                        'unpaid' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(
                        fn (string $state): string => ucfirst($state)
                    ),

                TextColumn::make('status')
                    ->label('Purchase Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'received' => 'success',
                        'draft' => 'warning',
                        'cancelled' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(
                        fn (string $state): string => ucfirst($state)
                    ),

                IconColumn::make('receipt')
                    ->label('Receipt')
                    ->icon(fn ($state) => filled($state)
                        ? Heroicon::OutlinedDocumentCheck
                        : Heroicon::OutlinedDocument
                    )
                    ->color(fn ($state) => filled($state)
                        ? 'success'
                        : 'gray'
                    ),

            ])
            ->filters([

                SelectFilter::make('status')
                    ->label('Purchase Status')
                    ->options([
                        'draft' => 'Draft',
                        'received' => 'Received',
                        'cancelled' => 'Cancelled',
                    ]),

                SelectFilter::make('payment_status')
                    ->label('Payment Status')
                    ->options([
                        'unpaid' => 'Unpaid',
                        'partial' => 'Partially Paid',
                        'paid' => 'Paid',
                    ]),

            ])
            ->recordActions([

                Action::make('view_receipt')
                    ->label('View Receipt')
                    ->icon(Heroicon::OutlinedDocumentMagnifyingGlass)
                    ->color('info')
                    ->url(
                        fn (StockPurchase $record): ?string =>
                            filled($record->receipt)
                                ? Storage::disk('public')->url($record->receipt)
                                : null
                    )
                    ->openUrlInNewTab()
                    ->visible(
                        fn (StockPurchase $record): bool =>
                            filled($record->receipt)
                    ),

                Action::make('receive')
                    ->label('Receive Stock')
                    ->icon(Heroicon::OutlinedArrowDownTray)
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Receive Stock')
                    ->modalDescription(
                        'Are you sure you want to receive this purchase? Product inventory will be increased and stock movements will be recorded.'
                    )
                    ->modalSubmitActionLabel('Yes, Receive Stock')
                    ->visible(
                        fn (StockPurchase $record): bool =>
                            $record->status === 'draft'
                    )
                    ->action(function (StockPurchase $record): void {

                        $purchase = app(StockPurchaseService::class)
                            ->receive($record);

                        Notification::make()
                            ->title('Stock received successfully')
                            ->body(
                                "Purchase {$purchase->purchase_number} has been received. Inventory has been updated."
                            )
                            ->success()
                            ->send();
                    }),

                EditAction::make(),

            ])
            ->defaultSort('created_at', 'desc');
    }
}