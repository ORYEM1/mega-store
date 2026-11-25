<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Homepage
        $xml .= '<url>';
        $xml .= '<loc>' . htmlspecialchars($baseUrl . '/', ENT_XML1, 'UTF-8') . '</loc>';
        $xml .= '<changefreq>daily</changefreq>';
        $xml .= '<priority>1.0</priority>';
        $xml .= '</url>';

        // Published products
        $products = Product::query()
            ->where('is_published', true)
            ->select(['id', 'updated_at'])
            ->get();

        foreach ($products as $product) {
            $productUrl = $baseUrl . '/products/' . $product->id;

            $xml .= '<url>';
            $xml .= '<loc>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</loc>';

            if ($product->updated_at) {
                $xml .= '<lastmod>' . $product->updated_at->toAtomString() . '</lastmod>';
            }

            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.8</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}