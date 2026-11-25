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

        // Product information.
        $title = $product->name . ' | Mega Store';

        $description = $product->description
            ?: 'Shop ' . $product->name . ' at Mega Store.';

        $description = preg_replace('/\s+/', ' ', $description);
        $description = mb_substr($description, 0, 160);

        // Product image.
        $image = $product->photo
            ? asset('storage/' . $product->photo)
            : asset('images/default-product.jpg');

        // Public URLs.
        $shareUrl = url('/share/products/' . $product->id);
        $productUrl = url('/products/' . $product->id);

        // Escape dynamic values before inserting them into HTML.
        $title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $description = htmlspecialchars(
            $description,
            ENT_QUOTES,
            'UTF-8'
        );

        $image = htmlspecialchars($image, ENT_QUOTES, 'UTF-8');
        $productUrl = htmlspecialchars(
            $productUrl,
            ENT_QUOTES,
            'UTF-8'
        );

        $shareUrl = htmlspecialchars(
            $shareUrl,
            ENT_QUOTES,
            'UTF-8'
        );

        $price = htmlspecialchars(
            (string) $product->price,
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
    <meta name="robots" content="noindex, follow">

    <link rel="canonical" href="{$productUrl}">

    <!-- Open Graph -->
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Mega Store">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta property="og:image" content="{$image}">
    <meta property="og:image:alt" content="{$title}">
    <meta property="og:url" content="{$productUrl}">

    <!-- Product information -->
    <meta property="product:price:amount" content="{$price}">
    <meta property="product:price:currency" content="UGX">

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{$title}">
    <meta name="twitter:description" content="{$description}">
    <meta name="twitter:image" content="{$image}">

    <!-- Redirect customers to the React product page -->
    <meta http-equiv="refresh" content="2;url={$productUrl}">
</head>

<body>
    <p>Redirecting to Mega Store...</p>

    <a href="{$productUrl}">View product</a>
</body>
</html>
HTML;

        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }
}