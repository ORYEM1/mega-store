<?php

namespace App\Filament\Clusters\Sales\Resources\Sellers;

use App\Filament\Clusters\Sales\Resources\Sellers\Pages\CreateSeller;
use App\Filament\Clusters\Sales\Resources\Sellers\Pages\EditSeller;
use App\Filament\Clusters\Sales\Resources\Sellers\Pages\ListSellers;
use App\Filament\Clusters\Sales\Resources\Sellers\Pages\ViewSeller;
use App\Filament\Clusters\Sales\Resources\Sellers\Schemas\SellerForm;
use App\Filament\Clusters\Sales\Resources\Sellers\Schemas\SellerInfolist;
use App\Filament\Clusters\Sales\Resources\Sellers\Tables\SellersTable;
use App\Filament\Clusters\Sales\SalesCluster;
use App\Models\Seller;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class SellerResource extends Resource
{
    protected static ?string $model = Seller::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $navigationLabel = 'Sellers';

    //protected static ?string $navigationGroup = 'Seller Management';

    protected static ?string $cluster = SalesCluster::class;

    protected static ?string $recordTitleAttribute = 'business_name';

    /**
     * Configure the seller form.
     */
    public static function form(Schema $schema): Schema
    {
        return SellerForm::configure($schema);
    }

    /**
     * Configure the seller infolist.
     */
    public static function infolist(Schema $schema): Schema
    {
        return SellerInfolist::configure($schema);
    }

    /**
     * Configure the seller table.
     */
    public static function table(Table $table): Table
    {
        return SellersTable::configure($table);
    }

    /**
     * Configure resource relationships.
     */
    public static function getRelations(): array
    {
        return [];
    }

    /**
     * Configure resource pages.
     */
    public static function getPages(): array
    {
        return [
            'index' => ListSellers::route('/'),
            'create' => CreateSeller::route('/create'),
            'view' => ViewSeller::route('/{record}'),
            'edit' => EditSeller::route('/{record}/edit'),
        ];
    }

    /**
     * Display the number of pending seller applications.
     */
    public static function getNavigationBadge(): ?string
    {
        $pending = static::getModel()::where(
            'approval_status',
            'pending'
        )->count();

        return $pending > 0 ? (string) $pending : null;
    }

    /**
     * Set the navigation badge color.
     */
    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}