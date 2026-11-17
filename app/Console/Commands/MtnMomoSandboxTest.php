<?php

namespace App\Console\Commands;

use App\Services\Payments\MtnMomoService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Throwable;

class MtnMomoSandboxTest extends Command
{
    protected $signature = 'momo:sandbox-test
                            {amount=1.00 : Test amount in EUR}
                            {phone=56733123453 : MTN sandbox test number}';

    protected $description = 'Test MTN MoMo Collection API using sandbox credentials';

    public function handle(MtnMomoService $mtnMomo): int
    {
        // 1. Ensure this is genuinely the sandbox environment.
        if (
            config('services.mtn_momo.target_environment') !== 'sandbox' ||
            config('services.mtn_momo.currency') !== 'EUR' ||
            !str_contains(
                config('services.mtn_momo.base_url'),
                'sandbox.momodeveloper.mtn.com'
            )
        ) {
            $this->error('This command can only run with MTN sandbox configuration.');

            return self::FAILURE;
        }

        // 2. Validate the test amount.
        $amount = $this->argument('amount');

        if (!is_numeric($amount) || (float) $amount <= 0) {
            $this->error('Enter a valid amount greater than zero.');

            return self::FAILURE;
        }

        $amount = number_format((float) $amount, 2, '.', '');

        // 3. Allow only MTN's predefined sandbox test numbers.
        $phone = $this->argument('phone');

        $testNumbers = [
            '46733123450' => 'FAILED',
            '46733123451' => 'REJECTED',
            '46733123452' => 'TIMEOUT',
            '56733123453' => 'SUCCESSFUL',
            '46733123454' => 'PENDING',
        ];

        if (!array_key_exists($phone, $testNumbers)) {
            $this->error('Invalid sandbox test number.');

            $this->line('Available test numbers:');

            foreach ($testNumbers as $number => $expectedStatus) {
                $this->line("$number => $expectedStatus");
            }

            return self::FAILURE;
        }

        $this->info('Starting MTN MoMo sandbox test...');
        $this->line("Amount: EUR $amount");
        $this->line("Test number: $phone");

        try {
            // 4. Initiate the sandbox payment.
            $externalId = 'sandbox-' . Str::uuid();

            $response = $mtnMomo->requestToPay(
                $amount,
                $phone,
                $externalId,
                'Adrian Collections sandbox test'
            );

            if (!$response['accepted']) {
                $this->error('MTN did not accept the payment request.');

                return self::FAILURE;
            }

            $referenceId = $response['reference_id'];

            $this->info('Payment request accepted by MTN.');

            $this->line("Reference ID: $referenceId");

            $this->line('Checking payment status...');

            // 5. Check status up to six times.
            for ($attempt = 1; $attempt <= 6; $attempt++) {
                sleep(5);

                $statusResponse = $mtnMomo->checkPaymentStatus(
                    $referenceId
                );

                $status = strtoupper(
                    $statusResponse['status'] ?? 'UNKNOWN'
                );

                $this->line("Attempt $attempt: $status");

                if (in_array($status, [
                    'SUCCESSFUL',
                    'FAILED',
                    'REJECTED',
                ])) {
                    break;
                }
            }

            // 6. Display the final result.
            $this->newLine();

            $this->info('MTN sandbox test completed.');

            $this->table(
                ['Field', 'Value'],
                [
                    ['Reference ID', $referenceId],
                    ['External ID', $externalId],
                    ['Amount', "EUR $amount"],
                    ['Phone', $phone],
                    ['Expected status', $testNumbers[$phone]],
                    ['Actual status', $status],
                ]
            );

            return self::SUCCESS;

        } catch (Throwable $exception) {
            $this->error('MTN sandbox test failed.');

            $this->line($exception->getMessage());

            return self::FAILURE;
        }
    }
}