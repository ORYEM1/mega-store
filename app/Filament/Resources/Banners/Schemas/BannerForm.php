<?php

namespace App\Filament\Resources\Banners\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class BannerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([

            // =========================================
            // BANNER CONTENT
            // =========================================
            Section::make('Banner Content')
                ->description('Enter the text that visitors will see on your homepage.')
                ->schema([

                    TextInput::make('title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('e.g. Own Your Style'),

                    Textarea::make('subtitle')
                        ->rows(3)
                        ->maxLength(1000)
                        ->placeholder('Enter a short promotional message.')
                        ->columnSpanFull(),

                    TextInput::make('button_text')
                        ->maxLength(100)
                        ->placeholder('e.g. Shop Now'),

                    TextInput::make('button_link')
                        ->maxLength(2048)
                        ->url()
                        ->placeholder('https://example.com/collections')
                        ->helperText('Enter the destination URL for the banner button.'),

                ])
                ->columns(2),

            // =========================================
            // BANNER IMAGES
            // =========================================
            Section::make('Banner Images')
                ->description('Upload the desktop and optional mobile versions of your banner.')
                ->schema([

                    FileUpload::make('image')
                        ->label('Desktop Banner Image')
                        ->image()
                        ->disk('public')
                        ->directory('banners')
                        ->visibility('public')
                        ->imageEditor()
                        ->required()
                        ->helperText('Recommended: wide landscape image, around 1920 × 700 pixels.'),

                    FileUpload::make('mobile_image')
                        ->label('Mobile Banner Image')
                        ->image()
                        ->disk('public')
                        ->directory('banners')
                        ->visibility('public')
                        ->imageEditor()
                        ->helperText('Optional. Recommended: portrait image for mobile screens.'),

                ])
                ->columns(2),

            // =========================================
            // DISPLAY SETTINGS
            // =========================================
            Section::make('Display Settings')
                ->description('Choose where and how this banner appears.')
                ->schema([

                    Select::make('position')
                        ->label('Banner Position')
                        ->options([
                            'hero' => 'Hero Banner',
                            'promo' => 'Promotional Banner',
                        ])
                        ->default('promo')
                        ->required()
                        ->live(),

                    Select::make('collection')
                        ->label('Show Banner For')
                        ->options([
                            'all' => 'All Collections',
                            'men' => 'Men',
                            'ladies' => 'Ladies',
                        ])
                        ->default('all')
                        ->required()
                        ->helperText('Choose which collection should display this banner.'),

                    Select::make('product_level')
                        ->label('Product Level')
                        ->options([
                            'affordable' => 'Affordable Collection',
                            'executive' => 'Executive Collection',
                        ])
                        ->placeholder('Select product level')
                        ->visible(fn ($get) => $get('position') === 'promo')
                        ->live()
                        ->helperText('Choose whether this promotional banner represents Affordable or Executive products.'),

                    TextInput::make('min_price')
                        ->label('Minimum Price (UGX)')
                        ->numeric()
                        ->integer()
                        ->minValue(0)
                        ->prefix('UGX')
                        ->visible(fn ($get) => $get('position') === 'promo')
                        ->required(fn ($get) => filled($get('product_level')))
                        ->helperText('Starting price displayed on the collection banner.'),

                    TextInput::make('max_price')
                        ->label('Maximum Price (UGX)')
                        ->numeric()
                        ->integer()
                        ->minValue(0)
                        ->prefix('UGX')
                        ->visible(fn ($get) => $get('position') === 'promo')
                        ->required(fn ($get) => filled($get('product_level')))
                        ->rules([
                            fn ($get) => function (string $attribute, $value, $fail) use ($get) {
                                $minimum = $get('min_price');

                                if (
                                    filled($value) &&
                                    filled($minimum) &&
                                    (float) $value < (float) $minimum
                                ) {
                                    $fail('The maximum price must be greater than or equal to the minimum price.');
                                }
                            },
                        ])
                        ->helperText('Highest price displayed on the collection banner.'),

                    TextInput::make('sort_order')
                        ->label('Display Order')
                        ->numeric()
                        ->integer()
                        ->minValue(0)
                        ->default(0)
                        ->required()
                        ->helperText('Lower numbers appear first.'),

                    Toggle::make('is_active')
                        ->label('Active')
                        ->default(true)
                        ->helperText('Only active banners should appear on the homepage.'),

                ])
                ->columns(2),

            // =========================================
            // PUBLICATION SCHEDULE
            // =========================================
            Section::make('Publication Schedule')
                ->description('Optionally control when this banner should be displayed.')
                ->schema([

                    DateTimePicker::make('starts_at')
                        ->label('Start Displaying'),

                    DateTimePicker::make('ends_at')
                        ->label('Stop Displaying'),

                ])
                ->columns(2),

        ]);
    }
}