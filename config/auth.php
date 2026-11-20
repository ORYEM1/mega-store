<?php

use App\Models\User;
use App\Models\Seller;
use App\Models\SellerStaff;

return [

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    */

    'guards' => [

        // Existing Filament and administrator authentication.
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // Existing seller authentication.
        'sellers' => [
            'driver' => 'session',
            'provider' => 'sellers',
        ],

        // New seller employee authentication.
        'seller_staff' => [
            'driver' => 'session',
            'provider' => 'seller_staff',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    */

    'providers' => [

        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', User::class),
        ],

        'sellers' => [
            'driver' => 'eloquent',
            'model' => Seller::class,
        ],

        'seller_staff' => [
            'driver' => 'eloquent',
            'model' => SellerStaff::class,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Password Resetting
    |--------------------------------------------------------------------------
    */

    'passwords' => [

        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
