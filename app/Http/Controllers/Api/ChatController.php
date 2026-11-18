<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Events\ChatMessageSent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * Create or resume a customer conversation.
     */
    public function createConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'size:64'],
        ]);

        // Resolve an authenticated customer if one is logged in.
        $customer = Auth::guard('sanctum')->user();

        $conversation = null;

        // Logged-in customers resume their latest conversation.
        if ($customer) {
            $conversation = ChatConversation::where(
                'customer_id',
                $customer->id
            )
                ->latest('id')
                ->first();
        }

        // Guests resume a conversation using their saved token.
        if (!$conversation && !empty($validated['token'])) {
            $conversation = ChatConversation::where(
                'token',
                $validated['token']
            )->first();
        }

        $reused = (bool) $conversation;

        if ($conversation) {
            // Reopen the existing conversation when the customer
            // deliberately starts/resumes a chat.
            $conversation->update([
                'guest_name' => $validated['guest_name'],
                'guest_email' => $validated['guest_email'] ?? null,
                'status' => 'open',
            ]);
        } else {
            $conversation = ChatConversation::create([
                'customer_id' => $customer?->id,
                'guest_name' => $validated['guest_name'],
                'guest_email' => $validated['guest_email'] ?? null,
                'subject' => $validated['subject'] ?? 'Customer Support',
                'status' => 'open',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $reused
                ? 'Existing conversation resumed successfully.'
                : 'Conversation created successfully.',
            'data' => [
                'token' => $conversation->token,
                'conversation_id' => $conversation->id,
                'guest_name' => $conversation->guest_name,
                'guest_email' => $conversation->guest_email,
                'status' => $conversation->status,
                'reused' => $reused,
            ],
        ], $reused ? 200 : 201);
    }

    /**
     * Retrieve a conversation and its messages.
     */
    public function showConversation(string $token): JsonResponse
    {
        $conversation = ChatConversation::where('token', $token)
            ->with([
                'messages' => function ($query) {
                    $query->oldest()->limit(100);
                },
            ])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => [
                    'id' => $conversation->id,
                    'token' => $conversation->token,
                    'customer_id' => $conversation->customer_id,
                    'guest_name' => $conversation->guest_name,
                    'guest_email' => $conversation->guest_email,
                    'subject' => $conversation->subject,
                    'status' => $conversation->status,
                ],
                'messages' => $conversation->messages,
            ],
        ]);
    }

    /**
     * Send a customer message.
     */
    public function sendMessage(
        Request $request,
        string $token
    ): JsonResponse {

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $conversation = ChatConversation::where('token', $token)
            ->where('status', 'open')
            ->firstOrFail();

        $message = DB::transaction(function () use (
            $conversation,
            $validated
        ) {
            $message = $conversation->messages()->create([
                'sender_type' => 'customer',
                'sender_id' => $conversation->customer_id,
                'body' => trim($validated['body']),
            ]);

            $conversation->update([
                'last_message_at' => now(),
            ]);

            return $message;
        });

        // Broadcast after the message has been saved.
        broadcast(new ChatMessageSent($message));

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully.',
            'data' => $message,
        ], 201);
    }
}