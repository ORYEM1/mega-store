<x-filament-panels::page>

    @php
        $selectedConversation = $this->getSelectedConversation();
    @endphp

    <div
        wire:poll.5s="refreshInbox"
        class="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >

        {{-- LEFT: CUSTOMER CONVERSATIONS --}}
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden">

            <div class="p-4 border-b dark:border-gray-800">
                <h2 class="text-lg font-bold">
                    Customer Conversations
                </h2>

                <p class="text-xs text-gray-500 mt-1">
                    Select a customer to view their messages.
                </p>
            </div>

            <div class="divide-y dark:divide-gray-800">

                @forelse ($this->getConversations() as $conversation)

                    @php
                        $latestMessage = $conversation->messages->first();

                        $isSelected = $selectedConversationId === $conversation->id;
                    @endphp

                    <button
                        type="button"
                        wire:key="conversation-{{ $conversation->id }}"
                        wire:click="selectConversation({{ $conversation->id }})"
                        class="w-full text-left p-4 transition
                            hover:bg-gray-100 dark:hover:bg-gray-800
                            {{ $isSelected
                                ? 'bg-primary-50 dark:bg-gray-800 border-l-4 border-primary-600'
                                : '' }}"
                    >

                        <div class="flex justify-between items-center gap-2">

                            <span class="font-semibold truncate">
                                {{ $conversation->guest_name ?? 'Guest' }}
                            </span>

                            <span class="text-xs px-2 py-1 rounded-full whitespace-nowrap
                                {{ $conversation->status === 'open' ? 'bg-green-100 text-green-700' : '' }}
                                {{ $conversation->status === 'pending' ? 'bg-yellow-100 text-yellow-700' : '' }}
                                {{ $conversation->status === 'closed' ? 'bg-red-100 text-red-700' : '' }}">
                                {{ ucfirst($conversation->status) }}
                            </span>

                        </div>

                        <p class="text-sm text-gray-500 mt-1 truncate">
                            {{ $conversation->guest_email ?? 'No email provided' }}
                        </p>

                        <div class="flex justify-between items-center gap-2 mt-3">

                            <p class="text-xs text-gray-500 truncate">

                                @if ($latestMessage)

                                    @if ($latestMessage->sender_type === 'admin')
                                        <span class="font-semibold">You:</span>
                                    @endif

                                    {{ $latestMessage->body }}

                                @else

                                    No messages yet

                                @endif

                            </p>

                            @if ($conversation->unread_messages_count > 0)

                                <span class="bg-primary-600 text-white text-xs font-bold rounded-full px-2 py-1">
                                    {{ $conversation->unread_messages_count }}
                                </span>

                            @endif

                        </div>

                        <p class="text-xs text-gray-400 mt-2">
                            {{ $conversation->last_message_at?->diffForHumans() ?? 'No activity' }}
                        </p>

                    </button>

                @empty

                    <div class="p-6 text-center text-gray-500">
                        No customer conversations yet.
                    </div>

                @endforelse

            </div>

        </div>


        {{-- RIGHT: CHAT WINDOW --}}
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 flex flex-col min-h-[600px]">

            @if ($selectedConversation)

                {{-- CUSTOMER DETAILS --}}
                <div class="p-4 border-b dark:border-gray-800">

                    <div class="flex justify-between items-center gap-3">

                        <div class="min-w-0">

                            <h2 class="font-bold text-lg truncate">
                                {{ $selectedConversation->guest_name ?? 'Guest' }}
                            </h2>

                            <p class="text-sm text-gray-500 truncate">
                                {{ $selectedConversation->guest_email ?? 'No email provided' }}
                            </p>

                            <p class="text-xs text-gray-400 mt-1">
                                Conversation #{{ $selectedConversation->id }}
                            </p>

                        </div>

                        <span class="text-xs px-3 py-1 rounded-full whitespace-nowrap
                            {{ $selectedConversation->status === 'open' ? 'bg-green-100 text-green-700' : '' }}
                            {{ $selectedConversation->status === 'pending' ? 'bg-yellow-100 text-yellow-700' : '' }}
                            {{ $selectedConversation->status === 'closed' ? 'bg-red-100 text-red-700' : '' }}">
                            {{ ucfirst($selectedConversation->status) }}
                        </span>

                    </div>

                </div>


                {{-- MESSAGE HISTORY --}}
                <div
                    id="chat-messages-container"
                    wire:key="chat-messages-{{ $selectedConversation->id }}"
                    class="flex-1 p-4 space-y-4 overflow-y-auto"
                    style="max-height: 600px;"
                    x-data
                    x-init="$nextTick(() => {
                        $el.scrollTop = $el.scrollHeight;
                    })"
                    x-effect="$nextTick(() => {
                        $el.scrollTop = $el.scrollHeight;
                    })"
                >

                    @forelse ($selectedConversation->messages as $message)

                        <div
                            wire:key="message-{{ $message->id }}"
                            class="flex {{ $message->sender_type === 'admin' ? 'justify-end' : 'justify-start' }}"
                        >

                            <div class="max-w-[85%] md:max-w-[75%] rounded-xl p-3 shadow-sm
                                {{ $message->sender_type === 'admin'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' }}">

                                <p class="text-xs font-semibold mb-1 opacity-80">

                                    {{ $message->sender_type === 'admin'
                                        ? 'You'
                                        : ($selectedConversation->guest_name ?? 'Customer') }}

                                </p>

                                <p class="text-sm whitespace-pre-wrap break-words">
                                    {{ $message->body }}
                                </p>

                                <p class="text-xs mt-2 opacity-70 text-right">
                                    {{ $message->created_at->format('H:i d M Y') }}
                                </p>

                            </div>

                        </div>

                    @empty

                        <div class="text-center text-gray-500 py-10">
                            No messages in this conversation yet.
                        </div>

                    @endforelse

                </div>


                {{-- REPLY FORM --}}
                @if ($selectedConversation->status !== 'closed')

                    <form
                        wire:submit="sendReply"
                        class="p-4 border-t dark:border-gray-800"
                    >

                        <div class="flex flex-col md:flex-row gap-3">

                            <textarea
                                wire:model="reply"
                                rows="2"
                                placeholder="Write your reply..."
                                class="flex-1 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500"
                            ></textarea>

                            <button
                                type="submit"
                                wire:loading.attr="disabled"
                                wire:target="sendReply"
                                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                            >

                                <span wire:loading.remove wire:target="sendReply">
                                    Send
                                </span>

                                <span wire:loading wire:target="sendReply">
                                    Sending...
                                </span>

                            </button>

                        </div>

                        @error('reply')

                            <p class="text-red-500 text-sm mt-2">
                                {{ $message }}
                            </p>

                        @enderror

                    </form>

                @else

                    <div class="p-4 border-t dark:border-gray-800 text-center text-red-500">
                        This conversation has been closed.
                    </div>

                @endif

            @else

                <div class="flex flex-1 items-center justify-center text-gray-500 p-6">

                    <div class="text-center">

                        <div class="text-4xl mb-3">
                            💬
                        </div>

                        <h3 class="font-semibold text-lg">
                            Customer Support
                        </h3>

                        <p class="text-sm mt-1">
                            Select a conversation to view its message history.
                        </p>

                    </div>

                </div>

            @endif

        </div>

    </div>

</x-filament-panels::page>