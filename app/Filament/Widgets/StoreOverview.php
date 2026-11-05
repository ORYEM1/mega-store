<?php

namespace App\Filament\Widgets;

use App\Models\Category;
use App\Models\Product;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StoreOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make(
                'Total Products',
                Product::count()
            )
                ->description('Products in your store')
                ->descriptionIcon('heroicon-m-cube')
                ->color('primary'),

            Stat::make(
                'Total Categories',
                Category::count()
            )
                ->description('Product categories')
                ->descriptionIcon('heroicon-m-squares-2x2')
                ->color('success'),

            Stat::make(
                'Low Stock Products',
                Product::where('stock_quantity', '<=', 5)->count()
            )
                ->description('Products with 5 or fewer items')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('warning'),
        ];
    }
}