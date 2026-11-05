<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Events\ChatMessageSent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * Create a new customer conversation.
     */
    public function createConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
        ]);

        $conversation = ChatConversation::create([
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'] ?? null,
            'subject' => $validated['subject'] ?? 'Customer Support',
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation created successfully.',
            'data' => [
                'token' => $conversation->token,
                'conversation_id' => $conversation->id,
                'status' => $conversation->status,
            ],
        ], 201);
    }

    /**
     * Retrieve a conversation and its messages.
     */
    public function showConversation(string $token): JsonResponse
    {
        $conversation = ChatConversation::where('token', $token)
            ->with(['messages' => function ($query) {
                $query->oldest()->limit(100);
            }])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => [
                    'token' => $conversation->token,
                    'guest_name' => $conversation->guest_name,
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

        // Save the message and update the conversation.
        $message = DB::transaction(function () use (
            $conversation,
            $validated
        ) {
            $message = $conversation->messages()->create([
                'sender_type' => 'customer',
                'sender_id' => $conversation->customer_id,
                'body' => $validated['body'],
            ]);

            $conversation->update([
                'last_message_at' => now(),
            ]);

            return $message;
        });

        // Broadcast only after the database transaction succeeds.
       broadcast(new ChatMessageSent($message));

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully.',
            'data' => $message,
        ], 201);
    }
}