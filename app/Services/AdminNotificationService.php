<?php

namespace App\Services;

use App\Models\User;
use Filament\Notifications\Notification;

class AdminNotificationService
{
    /**
     * Send a database notification to all administrators.
     */
    public function send(
        string $title,
        string $body,
        string $type = 'info'
    ): void {
        $notification = Notification::make()
            ->title($title)
            ->body($body);

        match ($type) {
            'success' => $notification->success(),
            'warning' => $notification->warning(),
            'danger' => $notification->danger(),
            default => $notification->info(),
        };

        $notification->sendToDatabase(
            User::query()->get()
        );
    }
}