<?php

namespace App\Filament\Pages;

use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use Illuminate\Support\Facades\Auth;
use Filament\Pages\Page;

class ChatInbox extends Page
{
    protected string $view = 'filament.pages.chat-inbox';

    protected static string|\BackedEnum|null $navigationIcon =
        'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Live Chat';

    protected static ?string $title = 'Customer Support Inbox';

    protected static ?int $navigationSort = 5;

    public ?int $selectedConversationId = null;

    public string $reply = '';

    public function getConversations()
    {
        return ChatConversation::query()
            ->with(['messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->withCount([
                'messages as unread_messages_count' => function ($query) {
                    $query->whereNull('read_at')
                        ->where('sender_type', 'customer');
                },
            ])
            ->orderByDesc('last_message_at')
            ->get();
    }

    public function getSelectedConversation()
    {
        if (!$this->selectedConversationId) {
            return null;
        }

        return ChatConversation::with([
            'messages' => function ($query) {
                $query->oldest();
            }
        ])->find($this->selectedConversationId);
    }

    public function selectConversation(int $id): void
    {
        $this->selectedConversationId = $id;

        $this->reply = '';

        // Mark customer messages as read.
        ChatConversation::findOrFail($id)
            ->messages()
            ->where('sender_type', 'customer')
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);
    }

    public function refreshInbox(): void
    {
        // Refresh the selected conversation when polling.
        // Do not reset the selected conversation or reply text.
    }

    public function sendReply(): void
    {
        $this->validate([
            'reply' => ['required', 'string', 'max:5000'],
        ]);

        if (!$this->selectedConversationId) {
            return;
        }

        $conversation = ChatConversation::findOrFail(
            $this->selectedConversationId
        );

        if ($conversation->status === 'closed') {
            return;
        }

        $message = $conversation->messages()->create([
            'sender_type' => 'admin',
            'sender_id' => Auth::id(),
            'body' => trim($this->reply),
        ]);

        $conversation->update([
            'last_message_at' => now(),
        ]);

        broadcast(new ChatMessageSent($message));

        $this->reply = '';

        $this->resetValidation('reply');
    }
}