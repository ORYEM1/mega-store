<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\SellerAuthController;
use App\Http\Middleware\EnsureSellerIsApproved;
use App\Http\Controllers\Api\SellerProductController;

// Public storefront routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/banners', [BannerController::class, 'index']);

// Customer authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get(
    '/products/{product}/reviews',
    [ProductReviewController::class, 'index']
);


// Seller marketplace routes
Route::prefix('seller')->group(function () {

    // Public seller authentication
    Route::post('/register', [SellerAuthController::class, 'register'])
        ->middleware('throttle:5,1');

    Route::post('/login', [SellerAuthController::class, 'login'])
        ->middleware('throttle:10,1');

    // Protected routes for approved sellers
    Route::middleware([
        'auth:sanctum',
        EnsureSellerIsApproved::class,
    ])->group(function () {

        // Seller account
        Route::get('/profile', [SellerAuthController::class, 'profile']);
        Route::post('/logout', [SellerAuthController::class, 'logout']);

        // Seller products
        Route::get('/categories', [SellerProductController::class, 'categories']);

        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);

        Route::get('/products/{id}', [SellerProductController::class, 'show']);
        Route::post('/products/{id}', [SellerProductController::class, 'update']);
        Route::delete('/products/{id}', [SellerProductController::class, 'destroy']);
    });
});
// Protected customer routes
Route::middleware('auth:sanctum')->group(function () {

    // Customer account
    Route::get('/customer', [AuthController::class, 'customer']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Order creation
    Route::post('/orders', [OrderController::class, 'store']);

    // Payment status verification
    Route::get(
        '/payments/{referenceId}/status',
        [PaymentController::class, 'checkStatus']
    );

    // Submit or update a product review.
    Route::post(
        '/products/{product}/reviews',
        [ProductReviewController::class, 'store']
    );

    // Customer orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);

});

// Chat routes
Route::prefix('chat')->group(function () {

    Route::post('/conversations', [
        ChatController::class,
        'createConversation'
    ])->middleware('throttle:10,1');

    Route::get('/conversations/{token}', [
        ChatController::class,
        'showConversation'
    ]);

    Route::post('/conversations/{token}/messages', [
        ChatController::class,
        'sendMessage'
    ])->middleware('throttle:30,1');

});