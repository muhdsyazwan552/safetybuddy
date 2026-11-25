<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;

use App\Http\Controllers\SubscriptionPlanController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyPurchased
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array((int) $request->user()->role_id, UserRole::companyIds(), true)) {
            return $next($request);
        }

        if ((int) $request->user()->role_id === UserRole::CompanyAdmin->value
            && $request->user()->email_verification_required
            && ! $request->user()->hasVerifiedEmail()) {
            if (! $request->is('verify-email', 'verify-email/*', 'email/verification-notification', 'logout')) {
                return redirect()->route('verification.notice');
            }

            return $next($request);
        }

        // Everything a company needs before it has a package: choose a plan, apply as a Training Provider,
        // link a provider reference code and redeem an activation code.
        if ($request->is('plans', 'plans/request', 'plans/training-provider', 'plans/reference-code', 'plans/activation-code', 'plans/registered-providers', 'subscription/start', 'manage-package/payments', 'logout')) {
            return $next($request);
        }

        $companyId = $request->user()?->company_id;
        if (!$companyId || !SubscriptionPlanController::hasActiveSafety((int) $companyId)) {
            return redirect()->route('subscription.plans');
        }

        return $next($request);
    }
}
