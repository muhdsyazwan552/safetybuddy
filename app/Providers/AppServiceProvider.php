<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Map entity_type strings to actual model classes
        Relation::morphMap([
            'staff' => \App\Models\CompanyStaff::class,
            'subcon' => \App\Models\SubconStaff::class,
        ]);
    }

    public function register(): void
    {
        //
    }
}