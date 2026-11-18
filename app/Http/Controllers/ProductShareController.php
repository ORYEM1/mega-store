<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Response;

class ProductShareController extends Controller
{
    public function show(int $id): Response
    {
        $product = Product::query()
            ->where('is_published', true)
            ->findOrFail($id);

        $title = htmlspecialchars(
            $product->name . ' | Mega Store',
            ENT_QUOTES,
            'UTF-8'
        );

        $description = htmlspecialchars(
            'UGX ' . number_format((float) $product->price)
                . ' - ' . ($product->description ?: $product->name),
            ENT_QUOTES,
            'UTF-8'
        );

        $image = $product->photo
            ? asset('storage/' . $product->photo)
            : asset('images/default-product.jpg');

        $url = url('/share/products/' . $product->id);

        $frontendUrl = url('/products/' . $product->id);

        $image = htmlspecialchars($image, ENT_QUOTES, 'UTF-8');
        $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        $frontendUrl = htmlspecialchars(
            $frontendUrl,
            ENT_QUOTES,
            'UTF-8'
        );

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{$title}</title>

    <meta name="description" content="{$description}">

    <meta property="og:type" content="product">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta property="og:image" content="{$image}">
    <meta property="og:url" content="{$url}">

    <meta property="product:price:amount"
          content="{$product->price}">

    <meta property="product:price:currency"
          content="UGX">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$title}">
    <meta name="twitter:description" content="{$description}">
    <meta name="twitter:image" content="{$image}">

    <meta http-equiv="refresh" content="0;url={$frontendUrl}">
</head>

<body>
    <p>Redirecting to product...</p>

    <a href="{$frontendUrl}">View product</a>
</body>
</html>
HTML;

        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }
}