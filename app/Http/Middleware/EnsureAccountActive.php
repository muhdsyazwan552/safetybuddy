<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Signs out an account that was deactivated while its session was still open. */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && $user->deactivated_at) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'This account has been deactivated.'], 403);
            }

            return redirect()->route('login')->withErrors(['email' => 'This account has been deactivated. Please contact your company admin.']);
        }

        return $next($request);
    }
}
