<?php

namespace App\Filament\Resources\ChatConversations\Tables;

use App\Filament\Pages\ChatInbox;
use App\Models\ChatConversation;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ChatConversationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([

                TextColumn::make('guest_name')
                    ->label('Customer')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                TextColumn::make('guest_email')
                    ->label('Email')
                    ->searchable()
                    ->placeholder('No email'),

                TextColumn::make('subject')
                    ->label('Subject')
                    ->searchable()
                    ->placeholder('General Support'),

                BadgeColumn::make('status')
                    ->colors([
                        'success' => 'open',
                        'warning' => 'pending',
                        'danger' => 'closed',
                    ]),

                TextColumn::make('assignedAdmin.name')
                    ->label('Assigned To')
                    ->placeholder('Unassigned'),

                TextColumn::make('last_message_at')
                    ->label('Last Message')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->placeholder('No messages'),

                TextColumn::make('created_at')
                    ->label('Started')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'open' => 'Open',
                        'pending' => 'Pending',
                        'closed' => 'Closed',
                    ]),
            ])
            ->recordActions([

                Action::make('openConversation')
                    ->label('Open Chat')
                    ->icon('heroicon-o-chat-bubble-left-right')
                    ->color('primary')
                    ->url(
                        fn (ChatConversation $record): string =>
                            ChatInbox::getUrl([
                                'conversation' => $record->id,
                            ])
                    ),

            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('last_message_at', 'desc');
    }
}