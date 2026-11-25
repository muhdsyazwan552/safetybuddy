<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
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

        // Accepts slugs (role:manager,supervisor) or legacy numbers (role:3,4).
        $allowed = array_filter(
            array_map(fn ($role) => UserRole::resolveId((string) $role), $roles),
            fn ($id) => $id !== null
        );

        if (in_array((int) $user->role_id, $allowed, true)) {
            return $next($request);
        }

        abort(403, 'Unauthorized access.');
    }
}