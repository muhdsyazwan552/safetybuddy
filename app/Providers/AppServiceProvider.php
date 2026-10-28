<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $baseUrl = rtrim(config('app.url'), '/');
            $url = clone URL::getFacadeRoot();
            $url->useOrigin($baseUrl);
            $url->forceScheme(parse_url($baseUrl, PHP_URL_SCHEME) ?: 'https');

            return $url->temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(config('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        });

        if ($caFile = config('mail.ca_file')) {
            Mail::mailer('smtp')->getSymfonyTransport()->getStream()->setStreamOptions([
                'ssl' => ['cafile' => $caFile],
            ]);
        }

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
