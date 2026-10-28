<?php

namespace App\Http\Middleware;

use App\Http\Controllers\SubscriptionPlanController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyPurchased
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array((int) $request->user()->role_id, [2, 3, 4, 7, 8], true)) {
            return $next($request);
        }

        if ((int) $request->user()->role_id === 2
            && $request->user()->email_verification_required
            && ! $request->user()->hasVerifiedEmail()) {
            if (! $request->is('verify-email', 'verify-email/*', 'email/verification-notification', 'logout')) {
                return redirect()->route('verification.notice');
            }

            return $next($request);
        }

        if ($request->is('plans', 'plans/request', 'subscription/start', 'logout')) {
            return $next($request);
        }

        $companyId = $request->user()?->company_id;
        if (!$companyId || !SubscriptionPlanController::hasActiveSafety((int) $companyId)) {
            return redirect()->route('subscription.plans');
        }

        return $next($request);
    }
}
