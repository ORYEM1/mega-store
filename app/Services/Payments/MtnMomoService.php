<?php

namespace App\Services\Payments;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MtnMomoService
{
    /**
     * Generate an MTN MoMo access token.
     */
    public function getAccessToken(): array
    {
        $baseUrl = rtrim(
            config('services.mtn_momo.base_url'),
            '/'
        );

        $response = Http::withBasicAuth(
            config('services.mtn_momo.api_user'),
            config('services.mtn_momo.api_key')
        )
        ->withHeaders([
            'Ocp-Apim-Subscription-Key' =>
                config('services.mtn_momo.subscription_key'),

            'X-Target-Environment' =>
                config('services.mtn_momo.target_environment'),

            'Accept' => 'application/json',
        ])
        ->post($baseUrl . '/collection/token/');

        $response->throw();

        return $response->json();
    }

    /**
     * Request payment from an MTN Mobile Money customer.
     */
    public function requestToPay(
        string $amount,
        string $phone,
        string $externalId,
        string $message = 'Mega Store Collections payment'
        ): array {

        $baseUrl = rtrim(
            config('services.mtn_momo.base_url'),
            '/'
        );

        // Generate a unique reference for this payment request.
        $referenceId = (string) Str::uuid();

        // Obtain an access token.
        $tokenData = $this->getAccessToken();

        $accessToken = $tokenData['access_token'];

        // Prepare payment information.
        $payload = [
            'amount' => $amount,

            'currency' => config('services.mtn_momo.currency'),

            'externalId' => $externalId,

            'payer' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $phone,
            ],

            'payerMessage' => $message,

            'payeeNote' => $message,
        ];

        // Send the payment request to MTN.
        $response = Http::withToken($accessToken)
            ->withHeaders([
                'Ocp-Apim-Subscription-Key' =>
                    config('services.mtn_momo.subscription_key'),

                'X-Target-Environment' =>
                    config('services.mtn_momo.target_environment'),

                'X-Reference-Id' => $referenceId,

                'Content-Type' => 'application/json',

                'Accept' => 'application/json',
            ])
            ->post(
                $baseUrl . '/collection/v1_0/requesttopay',
                $payload
            );

        $response->throw();

        return [
            'accepted' => $response->status() === 202,
            'reference_id' => $referenceId,
            'status_code' => $response->status(),
        ];
    }

    /**
 * Check the status of an MTN MoMo payment.
 */
    public function checkPaymentStatus(string $referenceId): array
    {
        $baseUrl = rtrim(
            config('services.mtn_momo.base_url'),
            '/'
        );
    
        // Obtain an access token.
        $tokenData = $this->getAccessToken();
    
        $accessToken = $tokenData['access_token'];
    
        // Query MTN for the transaction status.
        $response = Http::withToken($accessToken)
            ->withHeaders([
                'Ocp-Apim-Subscription-Key' =>
                    config('services.mtn_momo.subscription_key'),
    
                'X-Target-Environment' =>
                    config('services.mtn_momo.target_environment'),
    
                'Accept' => 'application/json',
    
                'Cache-Control' => 'no-cache',
            ])
            ->get(
                $baseUrl . '/collection/v1_0/requesttopay/' . $referenceId
            );
    
        $response->throw();
    
        return $response->json();
    }
}