<?php

namespace App\Filament\Resources\Suppliers\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class SuppliersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                TextColumn::make('name')
                    ->label('Supplier')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                TextColumn::make('company_name')
                    ->label('Company')
                    ->searchable()
                    ->sortable()
                    ->placeholder('N/A'),

                TextColumn::make('contact_person')
                    ->label('Contact Person')
                    ->searchable()
                    ->placeholder('N/A'),

                TextColumn::make('phone')
                    ->label('Phone')
                    ->searchable()
                    ->placeholder('N/A'),

                TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->placeholder('N/A'),

                IconColumn::make('is_active')
                    ->label('Status')
                    ->boolean(),

                TextColumn::make('created_at')
                    ->label('Date Added')
                    ->dateTime('d M Y')
                    ->sortable(),

            ])
            ->filters([

                TernaryFilter::make('is_active')
                    ->label('Supplier Status')
                    ->placeholder('All suppliers')
                    ->trueLabel('Active suppliers')
                    ->falseLabel('Inactive suppliers'),

            ])
            ->recordActions([
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