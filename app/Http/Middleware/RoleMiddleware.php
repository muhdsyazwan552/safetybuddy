<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // prevent empty role middleware
        if (empty($roles)) {
            abort(403, 'No roles specified.');
        }

        $user = Auth::user();

        if (in_array($user->role_id, $roles)) {
            return $next($request);
        }

        abort(403, 'Unauthorized access.');
    }
}