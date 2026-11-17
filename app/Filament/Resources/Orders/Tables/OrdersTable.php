<?php

namespace App\Filament\Resources\Orders\Tables;

use App\Filament\Resources\Orders\OrdersResource;
use App\Models\Orders;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('order_number')
                    ->label('Order Number')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('customer.first_name')
                    ->label('Customer')
                    ->formatStateUsing(
                        fn ($state, $record) =>
                            $record->customer
                                ? $record->customer->first_name . ' '
                                    . $record->customer->last_name
                                : 'Guest Customer'
                    )
                    ->searchable(),

                TextColumn::make('subtotal')
                    ->label('Subtotal')
                    ->money('UGX')
                    ->sortable(),

                TextColumn::make('total')
                    ->label('Total')
                    ->money('UGX')
                    ->sortable(),

                TextColumn::make('status')
                    ->label('Order Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'processing' => 'info',
                        'completed' => 'success',
                        'cancelled' => 'danger',
                        default => 'gray',
                    }),

                TextColumn::make('payment_status')
                    ->label('Payment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'pending' => 'warning',
                        'failed' => 'danger',
                        'refunded' => 'info',
                        default => 'gray',
                    }),

                TextColumn::make('created_at')
                    ->label('Order Date')
                    ->dateTime('d M Y, H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Order Status')
                    ->options([
                        'pending' => 'Pending',
                        'processing' => 'Processing',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                    ]),

                SelectFilter::make('payment_status')
                    ->label('Payment Status')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                        'refunded' => 'Refunded',
                    ]),
            ])
            ->recordActions([
                Action::make('viewItems')
                    ->label('View Items')
                    ->icon('heroicon-o-eye')
                    ->color('primary')
                    ->url(fn (Orders $record): string =>
                        OrdersResource::getUrl('view', [
                            'record' => $record->getKey(),
                        ])
                    ),

                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}