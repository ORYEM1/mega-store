<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductShareController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/share/products/{id}', [
    ProductShareController::class,
    'show'
])->name('products.share');