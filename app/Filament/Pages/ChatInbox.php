<?php

namespace App\Filament\Pages;

use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Url;

class ChatInbox extends Page
{
    protected string $view = 'filament.pages.chat-inbox';

    protected static string|\BackedEnum|null $navigationIcon =
        'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Live Chat';

    protected static ?string $title = 'Customer Support Inbox';

    protected static ?int $navigationSort = 5;

    // Keep the selected conversation in the browser URL.
    #[Url(as: 'conversation', history: true)]
    public ?int $selectedConversationId = null;

    public string $reply = '';

    /**
     * Handle a conversation ID supplied through the URL.
     */
    public function mount(): void
    {
        if ($this->selectedConversationId) {
            $this->markMessagesAsRead($this->selectedConversationId);
        }
    }

    /**
     * Retrieve all customer conversations.
     */
    public function getConversations()
    {
        return ChatConversation::query()
            ->with([
                'messages' => function ($query) {
                    $query->latest()->limit(1);
                },
            ])
            ->withCount([
                'messages as unread_messages_count' => function ($query) {
                    $query->whereNull('read_at')
                        ->where('sender_type', 'customer');
                },
            ])
            ->orderByDesc('last_message_at')
            ->get();
    }

    /**
     * Retrieve messages belonging to the selected conversation.
     */
    public function getSelectedConversation()
    {
        if (!$this->selectedConversationId) {
            return null;
        }

        return ChatConversation::with([
            'messages' => function ($query) {
                $query->oldest();
            },
        ])->find($this->selectedConversationId);
    }

    /**
     * Select a conversation from the inbox.
     */
    public function selectConversation(int $id): void
    {
        $conversation = ChatConversation::findOrFail($id);

        $this->selectedConversationId = $conversation->id;

        $this->reply = '';

        $this->resetValidation();

        $this->markMessagesAsRead($conversation->id);
    }

    /**
     * Mark unread customer messages as read.
     */
    private function markMessagesAsRead(int $conversationId): void
    {
        ChatConversation::findOrFail($conversationId)
            ->messages()
            ->where('sender_type', 'customer')
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);
    }

    /**
     * Refresh the inbox through Livewire polling.
     */
    public function refreshInbox(): void
    {
        // Livewire re-renders the page after this action.
        // The selected conversation and reply text remain unchanged.
    }

    /**
     * Send an admin reply to the selected conversation.
     */
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

        // Notify the customer through their conversation channel.
        broadcast(new ChatMessageSent($message));

        $this->reply = '';

        $this->resetValidation('reply');
    }
}