<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers\Tables;

use App\Models\Seller;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use App\Services\SellerRoleService;

class SellersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                TextColumn::make('first_name')
                    ->label('First Name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('last_name')
                    ->label('Last Name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('business_name')
                    ->label('Business Name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->label('Email Address')
                    ->searchable(),

                TextColumn::make('phone')
                    ->label('Phone Number')
                    ->searchable(),

                TextColumn::make('city')
                    ->label('City')
                    ->searchable()
                    ->placeholder('Not provided'),

                TextColumn::make('approval_status')
                    ->label('Application Status')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'pending' => 'warning',
                        'approved' => 'success',
                        'rejected' => 'danger',
                        'suspended' => 'gray',
                        default => 'secondary',
                    }),

                TextColumn::make('approved_at')
                    ->label('Approved On')
                    ->dateTime('d M Y')
                    ->placeholder('Not approved')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Registered On')
                    ->dateTime('d M Y')
                    ->sortable(),

            ])

            ->filters([

                SelectFilter::make('approval_status')
                    ->label('Seller Status')
                    ->options([
                        'pending' => 'Pending',
                        'approved' => 'Approved',
                        'rejected' => 'Rejected',
                        'suspended' => 'Suspended',
                    ]),

            ])

            ->recordActions([

                 Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Approve Seller')
                    ->modalDescription('Are you sure you want to approve this seller?')
                    ->visible(fn (Seller $record): bool =>
                        $record->approval_status === 'pending'
                    )
                    ->action(function (Seller $record, SellerRoleService $roleService): void {
                        $record->update([
                            'approval_status' => 'approved',
                            'approved_at' => now(),
                            'rejection_reason' => null,
                        ]);

                        $roleService->initializeDefaultRoles($record);
                    }),
                Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->modalHeading('Reject Seller Application')
                    ->schema([
                        Textarea::make('rejection_reason')
                            ->label('Reason for rejection')
                            ->required()
                            ->maxLength(1000),
                    ])
                    ->visible(fn (Seller $record): bool =>
                        $record->approval_status === 'pending'
                    )
                    ->action(function (Seller $record, array $data): void {
                        $record->update([
                            'approval_status' => 'rejected',
                            'approved_at' => null,
                            'rejection_reason' => $data['rejection_reason'],
                        ]);
                    }),

                Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Suspend Seller')
                    ->modalDescription('This seller will lose access to protected seller portal features.')
                    ->visible(fn (Seller $record): bool =>
                        $record->approval_status === 'approved'
                    )
                    ->action(function (Seller $record): void {
                        $record->update([
                            'approval_status' => 'suspended',
                        ]);
                    }),

                Action::make('restore')
                    ->label('Restore')
                    ->icon('heroicon-o-arrow-path')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Seller $record): bool =>
                        $record->approval_status === 'suspended'
                    )
                    ->action(function (Seller $record): void {
                        $record->update([
                            'approval_status' => 'approved',
                            'approved_at' => $record->approved_at ?? now(),
                        ]);
                    }),

                ViewAction::make(),

                EditAction::make(),

            ])

            ->toolbarActions([
                BulkActionGroup::make([
                    // Keep seller deletion as an individual, deliberate action.
                ]),
            ])

            ->defaultSort('created_at', 'desc');
    }
}