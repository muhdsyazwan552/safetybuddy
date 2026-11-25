<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\RoleMiddleware; // Add this line

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\EnsureAccountActive::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\EnsureCompanyPurchased::class,
            // NOTE: AddLinkHeadersForPreloadedAssets was removed on purpose.
            // It puts one `Link: <asset>; rel=preload` entry per JS chunk into the
            // RESPONSE HEADERS. On pages with many chunks (e.g. the subcon staff page)
            // the header exceeds nginx's default fastcgi buffer (4k) and nginx answers
            // "502 Bad Gateway – upstream sent too big header". The same preload tags
            // are already in the HTML, so nothing is lost.
        ]);
        
        // Register role middleware alias
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'purchased' => \App\Http\Middleware\EnsureCompanyPurchased::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Uploads bigger than PHP's post_max_size never reach validation, so the
        // form would fail silently. Turn that into a clear, field-level message.
        $exceptions->render(function (\Illuminate\Http\Exceptions\PostTooLargeException $e, \Illuminate\Http\Request $request) {
            $message = 'The files you selected are too large to upload together (server limit: '
                . ini_get('post_max_size') . '). Please remove some photos or use smaller ones, then try again.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message, 'errors' => ['photos' => [$message]]], 422);
            }

            return back()->withErrors(['photos' => $message]);
        });
    })->create();
