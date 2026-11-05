<?php

namespace App\Console\Commands;

use App\Services\AdminNotificationService;
use Illuminate\Console\Command;

class TestAdminNotification extends Command
{
    protected $signature = 'notifications:test';

    protected $description = 'Test the admin database notification system';

    public function handle(
        AdminNotificationService $notifications
    ): int {
        $notifications->send(
            'Notification Test',
            'Your Adrian Store admin notifications are working.',
            'success'
        );

        $this->info('Test notification sent to administrators.');

        return self::SUCCESS;
    }
}