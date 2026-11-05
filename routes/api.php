<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\PaymentController;

Route::get('/products', [ProductController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/banners', [BannerController::class, 'index']);

// Customer authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected customer routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer', [AuthController::class, 'customer']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get(
    '/payments/{referenceId}/status',
    [PaymentController::class, 'checkStatus']
);

Route::post('/orders', [OrderController::class, 'store']);

Route::prefix('chat')->group(function () {

    // Create a conversation
    Route::post('/conversations', [
        ChatController::class,
        'createConversation'
    ])->middleware('throttle:10,1');

    // Retrieve conversation and messages
    Route::get('/conversations/{token}', [
        ChatController::class,
        'showConversation'
    ]);

    // Send a message
    Route::post('/conversations/{token}/messages', [
        ChatController::class,
        'sendMessage'
    ])->middleware('throttle:30,1');

});