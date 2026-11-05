<x-filament-panels::page>

    @php
        $selectedConversation = $this->getSelectedConversation();
    @endphp

    <div
        wire:poll.5s="refreshInbox"
        class="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >

        {{-- Conversations List --}}
        <div class="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden">

            <div class="p-4 border-b dark:border-gray-800">
                <h2 class="text-lg font-bold">
                    Customer Conversations
                </h2>
            </div>

            <div class="divide-y dark:divide-gray-800">

                @forelse ($this->getConversations() as $conversation)

                    @php
                        $latestMessage = $conversation->messages->first();
                    @endphp

                    <button
                        type="button"
                        wire:click="selectConversation({{ $conversation->id }})"
                        class="w-full text-left p-4 transition hover:bg-gray-100 dark:hover:bg-gray-800
                        {{ $selectedConversationId === $conversation->id
                            ? 'bg-gray-100 dark:bg-gray-800'
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

                        <div class="flex justify-between items-center gap-2 mt-2">

                            <p class="text-xs text-gray-400 truncate">
                                @if ($latestMessage)
                                    {{ $latestMessage->sender_type === 'admin' ? 'You: ' : '' }}
                                    {{ $latestMessage->body }}
                                @else
                                    No messages yet
                                @endif
                            </p>

                            @if ($conversation->unread_messages_count > 0)
                                <span class="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
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


        {{-- Chat Window --}}
        <div class="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 flex flex-col min-h-[600px]">

            @if ($selectedConversation)

                {{-- Customer Details --}}
                <div class="p-4 border-b dark:border-gray-800">

                    <div class="flex justify-between items-center gap-3">

                        <div>
                            <h2 class="font-bold text-lg">
                                {{ $selectedConversation->guest_name ?? 'Guest' }}
                            </h2>

                            <p class="text-sm text-gray-500">
                                {{ $selectedConversation->guest_email ?? 'No email provided' }}
                            </p>
                        </div>

                        <span class="text-xs px-3 py-1 rounded-full
                            {{ $selectedConversation->status === 'open' ? 'bg-green-100 text-green-700' : '' }}
                            {{ $selectedConversation->status === 'pending' ? 'bg-yellow-100 text-yellow-700' : '' }}
                            {{ $selectedConversation->status === 'closed' ? 'bg-red-100 text-red-700' : '' }}">
                            {{ ucfirst($selectedConversation->status) }}
                        </span>

                    </div>

                </div>


                {{-- Messages --}}
                <div
                    class="flex-1 p-4 space-y-4 overflow-y-auto"
                    style="max-height: 600px;"
                >

                    @forelse ($selectedConversation->messages as $message)

                        <div class="flex {{ $message->sender_type === 'admin' ? 'justify-end' : 'justify-start' }}">

                            <div class="max-w-[85%] md:max-w-[75%] rounded-xl p-3
                                {{ $message->sender_type === 'admin'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' }}">

                                <p class="text-xs font-semibold mb-1 opacity-80">
                                    {{ $message->sender_type === 'admin' ? 'You' : ($selectedConversation->guest_name ?? 'Customer') }}
                                </p>

                                <p class="text-sm whitespace-pre-wrap break-words">
                                    {{ $message->body }}
                                </p>

                                <p class="text-xs mt-2 opacity-70">
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


                {{-- Reply Form --}}
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
                                class="flex-1 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                            ></textarea>

                            <button
                                type="submit"
                                wire:loading.attr="disabled"
                                wire:target="sendReply"
                                class="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
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
                    Select a conversation to start chatting.
                </div>

            @endif

        </div>

    </div>

</x-filament-panels::page>