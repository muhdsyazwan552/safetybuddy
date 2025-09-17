<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ✅ Keep your vite prefetch
        Vite::prefetch(concurrency: 3);

        // ✅ Add morph map here
        Relation::morphMap([
            'CP' => \App\Models\Executor::class,  // companies
            'EM' => \App\Models\User::class,      // employees (role_id = 5)
        ]);
    }
}
