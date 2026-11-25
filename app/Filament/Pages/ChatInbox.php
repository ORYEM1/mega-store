<?php

namespace App\Filament\Pages;

use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Livewire\Attributes\Url;

class ChatInbox extends Page
{
    protected string $view = 'filament.pages.chat-inbox';

    protected static string|\BackedEnum|null $navigationIcon =
        'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Live Chat';

    protected static ?string $title = 'Customer Support Inbox';

    protected static ?int $navigationSort = 5;

    /**
     * Shared support presence cache key.
     */
    private const PRESENCE_CACHE_KEY = 'chat:support:online';

    /**
     * How long support remains online without a heartbeat.
     */
    private const PRESENCE_TTL_SECONDS = 20;

    #[Url(as: 'conversation', history: true)]
    public ?int $selectedConversationId = null;

    public string $reply = '';

    public function mount(): void
    {
        $this->updateSupportPresence();

        if ($this->selectedConversationId) {
            $this->markMessagesAsRead($this->selectedConversationId);
        }
    }

    /**
     * Mark support as online while this inbox is open.
     */
    private function updateSupportPresence(): void
    {
        Cache::put(
            self::PRESENCE_CACHE_KEY,
            [
                'admin_id' => Auth::id(),
                'last_seen' => now()->toISOString(),
            ],
            now()->addSeconds(self::PRESENCE_TTL_SECONDS)
        );
    }

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

    public function selectConversation(int $id): void
    {
        $conversation = ChatConversation::findOrFail($id);

        $this->selectedConversationId = $conversation->id;

        $this->reply = '';

        $this->resetValidation();

        $this->markMessagesAsRead($conversation->id);
    }

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
     * Refresh inbox and renew the support heartbeat.
     */
    public function refreshInbox(): void
    {
        $this->updateSupportPresence();
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