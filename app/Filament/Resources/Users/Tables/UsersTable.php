<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                TextColumn::make('name')
                    ->label('Full Name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->label('Email Address')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                TextColumn::make('roles.name')
                    ->label('Role')
                    ->badge()
                    ->color('success')
                    ->placeholder('No role assigned'),

                TextColumn::make('created_at')
                    ->label('Date Created')
                    ->dateTime('d M Y, h:i A')
                    ->sortable(),

            ])

            ->filters([

                SelectFilter::make('role')
                    ->label('Filter by Role')
                    ->relationship('roles', 'name')
                    ->preload(),

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