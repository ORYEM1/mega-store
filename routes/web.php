<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductShareController;
use App\Http\Controllers\SitemapController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/share/products/{id}', [
    ProductShareController::class,
    'show'
])->name('products.share');

Route::get('/sitemap.xml', [
    SitemapController::class,
    'index'
])->name('sitemap');