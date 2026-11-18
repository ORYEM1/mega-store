<x-filament-panels::page>

    @php
        $selectedConversation = $this->getSelectedConversation();
        $conversations = $this->getConversations();
    @endphp

    <div
        wire:poll.5s="refreshInbox"
        class="space-y-5"
    >

        {{-- CHAT PAGE INTRODUCTION --}}
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                    Customer Support
                </h2>

                <p class="text-sm text-gray-500 mt-1">
                    Manage customer conversations and respond to enquiries.
                </p>
            </div>

            <div class="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                Live inbox
            </div>

        </div>


        {{-- MAIN CHAT LAYOUT --}}
        <div
            class="grid grid-cols-1 lg:grid-cols-[350px_minmax(0,1fr)] gap-5 items-start"
        >

            {{-- =========================================
                 LEFT: CONVERSATION SIDEBAR
            ========================================== --}}
            <div
                class="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden"
                style="border: 1px solid #9ca3af;"
            >

                {{-- SIDEBAR HEADER --}}
                <div
                    class="px-5 py-5"
                    style="background: #252525; border-bottom: 3px solid #c6ff00;"
                >

                    <div class="flex items-center justify-between gap-3">

                        <div>
                            <h3 class="text-white text-lg font-bold">
                                Conversations
                            </h3>

                            <p class="text-xs mt-1" style="color: #d1d5db;">
                                Customer messages
                            </p>
                        </div>

                        <div
                            class="rounded-lg px-3 py-2 text-sm font-bold"
                            style="background: #c6ff00; color: #252525;"
                        >
                            {{ $conversations->count() }}
                        </div>

                    </div>

                </div>


                {{-- CONVERSATION LIST --}}
                <div
                    class="overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800"
                    style="max-height: 680px;"
                >

                    @forelse ($conversations as $conversation)

                        @php
                            $latestMessage = $conversation->messages->first();

                            $isSelected = $selectedConversationId === $conversation->id;

                            $customerName = $conversation->guest_name ?? 'Guest';

                            $initials = collect(explode(' ', trim($customerName)))
                                ->filter()
                                ->take(2)
                                ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                                ->implode('');
                        @endphp

                        <button
                            type="button"
                            wire:key="conversation-{{ $conversation->id }}"
                            wire:click="selectConversation({{ $conversation->id }})"
                            class="w-full text-left p-4 transition duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            style="
                                border-left: 4px solid {{ $isSelected ? '#c6ff00' : 'transparent' }};
                                background: {{ $isSelected ? '#f3f4f6' : 'transparent' }};
                            "
                        >

                            <div class="flex items-start gap-3">

                                {{-- CUSTOMER AVATAR --}}
                                <div
                                    class="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                                    style="background: #252525; color: #c6ff00;"
                                >
                                    {{ $initials ?: 'G' }}
                                </div>


                                {{-- CUSTOMER DETAILS --}}
                                <div class="flex-1 min-w-0">

                                    <div class="flex items-center justify-between gap-2">

                                        <h4 class="font-bold text-sm text-gray-900 dark:text-white truncate">
                                            {{ $customerName }}
                                        </h4>

                                        <span
                                            class="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap
                                                {{ $conversation->status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : '' }}
                                                {{ $conversation->status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : '' }}
                                                {{ $conversation->status === 'closed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : '' }}"
                                        >
                                            {{ ucfirst($conversation->status) }}
                                        </span>

                                    </div>


                                    <p class="text-xs text-gray-500 truncate mt-1">
                                        {{ $conversation->guest_email ?? 'No email provided' }}
                                    </p>


                                    {{-- LATEST MESSAGE --}}
                                    <div class="flex items-center justify-between gap-2 mt-3">

                                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">

                                            @if ($latestMessage)

                                                @if ($latestMessage->sender_type === 'admin')
                                                    <span class="font-bold">You:</span>
                                                @endif

                                                {{ $latestMessage->body }}

                                            @else

                                                No messages yet

                                            @endif

                                        </p>


                                        {{-- UNREAD COUNT --}}
                                        @if ($conversation->unread_messages_count > 0)

                                            <span
                                                class="flex-shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold px-1"
                                                style="background: #c6ff00; color: #252525;"
                                            >
                                                {{ $conversation->unread_messages_count }}
                                            </span>

                                        @endif

                                    </div>


                                    {{-- LAST ACTIVITY --}}
                                    <p class="text-xs text-gray-400 mt-2">
                                        {{ $conversation->last_message_at?->diffForHumans() ?? 'No activity' }}
                                    </p>

                                </div>

                            </div>

                        </button>

                    @empty

                        <div class="p-10 text-center">

                            <div class="text-4xl mb-3">
                                💬
                            </div>

                            <h4 class="font-semibold text-gray-800 dark:text-white">
                                No conversations yet
                            </h4>

                            <p class="text-sm text-gray-500 mt-2">
                                Customer messages will appear here.
                            </p>

                        </div>

                    @endforelse

                </div>

            </div>



            {{-- =========================================
                 RIGHT: CHAT WINDOW
            ========================================== --}}
            <div
                class="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col"
                style="border: 1px solid #9ca3af; min-height: 600px; height: min(780px, 85vh);"
            >

                @if ($selectedConversation)

                    {{-- CHAT HEADER --}}
                    <div
                        class="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        style="background: #252525; border-bottom: 3px solid #c6ff00;"
                    >

                        <div class="flex items-center gap-3 min-w-0">

                            @php
                                $selectedName = $selectedConversation->guest_name ?? 'Guest';

                                $selectedInitials = collect(explode(' ', trim($selectedName)))
                                    ->filter()
                                    ->take(2)
                                    ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                                    ->implode('');
                            @endphp

                            <div
                                class="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold"
                                style="background: #c6ff00; color: #252525;"
                            >
                                {{ $selectedInitials ?: 'G' }}
                            </div>

                            <div class="min-w-0">

                                <h3 class="text-white font-bold text-base truncate">
                                    {{ $selectedConversation->guest_name ?? 'Guest Customer' }}
                                </h3>

                                <p class="text-xs truncate" style="color: #d1d5db;">
                                    {{ $selectedConversation->guest_email ?? 'No email provided' }}
                                </p>

                                <p class="text-xs mt-1" style="color: #9ca3af;">
                                    Conversation #{{ $selectedConversation->id }}
                                </p>

                            </div>

                        </div>


                        {{-- CONVERSATION STATUS --}}
                        <div class="flex items-center">

                            <span
                                class="text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap
                                    {{ $selectedConversation->status === 'open' ? 'bg-green-100 text-green-700' : '' }}
                                    {{ $selectedConversation->status === 'pending' ? 'bg-yellow-100 text-yellow-700' : '' }}
                                    {{ $selectedConversation->status === 'closed' ? 'bg-red-100 text-red-700' : '' }}"
                            >
                                {{ ucfirst($selectedConversation->status) }}
                            </span>

                        </div>

                    </div>



                    {{-- MESSAGE HISTORY --}}
                    <div
                        id="chat-messages-container"
                        wire:key="chat-messages-{{ $selectedConversation->id }}"
                        class="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto"
                        style="min-height: 0; background: #f9fafb;"
                        x-data
                        x-init="$nextTick(() => {
                            $el.scrollTop = $el.scrollHeight;
                        })"
                        x-effect="$nextTick(() => {
                            $el.scrollTop = $el.scrollHeight;
                        })"
                    >

                        {{-- CHAT DATE / INTRODUCTION --}}
                        <div class="flex justify-center mb-5">

                            <span class="text-xs text-gray-500 bg-white rounded-full px-4 py-2 shadow-sm">
                                Conversation started
                            </span>

                        </div>


                        @forelse ($selectedConversation->messages as $message)

                            <div
                                wire:key="message-{{ $message->id }}"
                                class="flex {{ $message->sender_type === 'admin' ? 'justify-end' : 'justify-start' }}"
                            >

                                <div
                                    class="flex flex-col max-w-[90%] sm:max-w-[75%]"
                                    style="align-items: {{ $message->sender_type === 'admin' ? 'flex-end' : 'flex-start' }};"
                                >

                                    {{-- SENDER NAME --}}
                                    <span class="text-xs font-semibold text-gray-500 mb-1 px-2">
                                        {{ $message->sender_type === 'admin'
                                            ? 'You'
                                            : ($selectedConversation->guest_name ?? 'Customer') }}
                                    </span>


                                    {{-- MESSAGE BUBBLE --}}
                                    <div
                                        class="rounded-2xl px-4 py-3 shadow-sm"
                                        style="
                                            background: {{ $message->sender_type === 'admin' ? '#252525' : '#ffffff' }};
                                            color: {{ $message->sender_type === 'admin' ? '#ffffff' : '#252525' }};
                                            border: {{ $message->sender_type === 'admin' ? '1px solid #252525' : '1px solid #e5e7eb' }};
                                            border-bottom-{{ $message->sender_type === 'admin' ? 'right' : 'left' }}-radius: 4px;
                                        "
                                    >

                                        <p class="text-sm leading-6 whitespace-pre-wrap break-words">
                                            {{ $message->body }}
                                        </p>

                                    </div>


                                    {{-- MESSAGE TIME --}}
                                    <span class="text-xs text-gray-400 mt-2 px-2">
                                        {{ $message->created_at->format('H:i · d M Y') }}
                                    </span>

                                </div>

                            </div>

                        @empty

                            <div class="flex items-center justify-center h-full">

                                <div class="text-center">

                                    <div class="text-4xl mb-3">
                                        💬
                                    </div>

                                    <h4 class="font-semibold text-gray-700 dark:text-white">
                                        No messages yet
                                    </h4>

                                    <p class="text-sm text-gray-500 mt-1">
                                        Send a message to start this conversation.
                                    </p>

                                </div>

                            </div>

                        @endforelse

                    </div>



                    {{-- REPLY FORM --}}
                    @if ($selectedConversation->status !== 'closed')

                        <form
                            wire:submit="sendReply"
                            class="p-4 sm:p-5 flex-shrink-0"
                            style="background: #ffffff; border-top: 1px solid #e5e7eb;"
                        >

                            <div class="flex flex-col sm:flex-row gap-3 items-stretch">

                                <div class="flex-1">

                                    <textarea
                                        wire:model="reply"
                                        rows="2"
                                        placeholder="Write your reply to the customer..."
                                        class="w-full rounded-xl border border-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                                        style="min-height: 65px;"
                                    ></textarea>

                                </div>


                                <button
                                    type="submit"
                                    wire:loading.attr="disabled"
                                    wire:target="sendReply"
                                    class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
                                    style="background: #252525; color: #c6ff00; min-width: 115px;"
                                >

                                    <span wire:loading.remove wire:target="sendReply">
                                        Send Reply
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


                            <p class="text-xs text-gray-400 mt-2">
                                Your reply will be sent directly to the customer.
                            </p>

                        </form>

                    @else

                        {{-- CLOSED CONVERSATION --}}
                        <div
                            class="p-5 text-center flex-shrink-0"
                            style="background: #fef2f2; border-top: 1px solid #fecaca;"
                        >

                            <p class="text-sm font-semibold text-red-600">
                                This conversation has been closed.
                            </p>

                            <p class="text-xs text-red-500 mt-1">
                                Replies are disabled for this conversation.
                            </p>

                        </div>

                    @endif


                @else

                    {{-- EMPTY CHAT STATE --}}
                    <div class="flex-1 flex items-center justify-center p-6">

                        <div class="text-center max-w-sm">

                            <div
                                class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl"
                                style="background: #252525; color: #c6ff00;"
                            >
                                💬
                            </div>

                            <h3 class="font-bold text-xl text-gray-900 dark:text-white">
                                Welcome to Customer Support
                            </h3>

                            <p class="text-sm text-gray-500 mt-2 leading-6">
                                Select a conversation from the left panel to view customer messages and respond to enquiries.
                            </p>

                            <div
                                class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg text-xs font-semibold"
                                style="background: #f3f4f6; color: #252525;"
                            >
                                <span>●</span>
                                Ready to assist customers
                            </div>

                        </div>

                    </div>

                @endif

            </div>

        </div>

    </div>

</x-filament-panels::page>