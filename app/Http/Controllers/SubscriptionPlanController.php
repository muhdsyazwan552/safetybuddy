<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Payments;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubscriptionsCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    public static function hasPurchased(int $companyId): bool
    {
        return SubscriptionPlanRequest::where('company_id', $companyId)->where('status', 'approved')->exists()
            || SubscriptionsCompany::where('company_id', $companyId)
                ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
                ->exists();
    }

    public static function hasActiveSafety(int $companyId): bool
    {
        return SubscriptionsCompany::where('company_id', $companyId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
            ->exists();
    }

    public function start(Request $request)
    {
        $companyId = $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        return redirect()->route(self::hasActiveSafety((int) $companyId) ? 'dashboard.inspection' : 'subscription.plans');
    }

    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $details = self::detailsForCompany((int) $companyId);

        return Inertia::render('Subscription/Plans', [
            'plans' => SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get(),
            'hasPurchased' => self::hasPurchased((int) $companyId),
            'hasActiveSafety' => self::hasActiveSafety((int) $companyId),
            'canPurchase' => (int) $request->user()->role_id === 2,
            'currentPackage' => $details['currentPackage'],
            'subscriptionHistory' => $details['history'],
            'inspectorSeats' => self::hasActiveSafety((int) $companyId) ? [
                'included' => \App\Services\CompanySeatLimits::snapshot((int) $companyId)['roles'][7]['included'],
                'extra' => \App\Services\CompanySeatLimits::extraInspectors((int) $companyId),
                'used' => \App\Services\CompanySeatLimits::snapshot((int) $companyId)['roles'][7]['used'],
                'price' => SubscriptionAddon::INSPECTOR_PRICE,
                'purchases' => SubscriptionAddon::where('company_id', $companyId)->where('type', 'inspector')->latest('id')->limit(10)->get(['id', 'quantity', 'total_amount', 'created_at'])
                    ->map(fn ($a) => ['id' => $a->id, 'quantity' => $a->quantity, 'total_amount' => $a->total_amount, 'date' => $a->created_at->format('Y-m-d')])->values(),
            ] : null,
            'latestRequest' => SubscriptionPlanRequest::with('plan:id,name')
                ->where('company_id', $companyId)->latest()->first(),
        ]);
    }

    public static function detailsForCompany(int $companyId): array
    {
        $subscriptions = SubscriptionsCompany::with(['module:id,code,name', 'plan:id,name'])
            ->where('company_id', $companyId)
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get();
        $subscriptionIds = $subscriptions->pluck('id');
        $planOrders = SubscriptionPlanRequest::with('plan:id,name')
            ->where('company_id', $companyId)
            ->where('status', 'approved')
            ->whereIn('subscription_id', $subscriptionIds)
            ->get()
            ->keyBy('subscription_id');
        $payments = Payments::where('company_id', $companyId)
            ->whereIn('subscription_id', $subscriptionIds)
            ->where('payment_status', 'completed')
            ->orderByDesc('id')
            ->get()
            ->keyBy('subscription_id');

        $history = $subscriptions->map(function (SubscriptionsCompany $subscription) use ($planOrders, $payments) {
            $order = $planOrders->get($subscription->id);
            $payment = $payments->get($subscription->id);
            $active = $subscription->status === 'active'
                && $subscription->end_date
                && $subscription->end_date->toDateString() >= today()->toDateString();

            return [
                'id' => $subscription->id,
                'package_name' => $subscription->plan?->name ?? $order?->plan?->name ?? $subscription->module?->name ?? 'Legacy package',
                'module_name' => $subscription->module?->name,
                'module_code' => $subscription->module?->code,
                'amount' => $payment?->total_amount !== null
                    ? (float) $payment->total_amount
                    : ($order ? (float) $order->price_yearly : null),
                'payment_recorded' => $payment !== null,
                'start_date' => $subscription->start_date?->format('Y-m-d'),
                'end_date' => $subscription->end_date?->format('Y-m-d'),
                'status' => $active ? 'active' : ($subscription->status === 'active' ? 'expired' : $subscription->status),
                'type' => $subscription->type,
                'days_remaining' => $active ? (int) today()->diffInDays($subscription->end_date, false) : null,
            ];
        })->values();

        $safetyHistory = $history->where('module_code', 'SB360-WSIS');
        $currentPackage = $safetyHistory->firstWhere('status', 'active') ?? $safetyHistory->first();

        return [
            'currentPackage' => $currentPackage,
            'history' => $history,
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['plan_id' => ['required', 'exists:subscription_plans,id']]);
        $companyId = $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        if (self::hasActiveSafety((int) $companyId)) {
            throw ValidationException::withMessages(['plan_id' => 'Your Safety Buddy subscription is active. Contact Ramzi to change your package.']);
        }

        $plan = SubscriptionPlan::whereKey($validated['plan_id'])->where('is_active', true)->firstOrFail();
        if (SubscriptionPlanRequest::where('company_id', $companyId)->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['plan_id' => 'A purchase request is already awaiting review.']);
        }

        SubscriptionPlanRequest::create([
            'company_id' => $companyId,
            'plan_id' => $plan->id,
            'price_yearly' => $plan->price_yearly,
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        return redirect()->route('subscription.plans')->with('success', 'Purchase request sent. Contact Ramzi at 016-8865619 to arrange payment. Access starts after payment is confirmed.');
    }

    /** Extra Inspector seats: RM 800 each, one-time, available on any package and active straight away. */
    public function storeInspectorAddon(Request $request)
    {
        abort_unless((int) $request->user()->role_id === 2, 403, 'Only the company admin can buy extra Inspectors.');
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:50']]);

        if (! self::hasActiveSafety($companyId)) {
            throw ValidationException::withMessages(['quantity' => 'Choose and activate a package before adding Inspectors.']);
        }

        $subscription = SubscriptionsCompany::where('company_id', $companyId)
            ->where('status', 'active')->whereDate('start_date', '<=', today())->whereDate('end_date', '>=', today())
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
            ->latest('start_date')->first();

        $quantity = (int) $validated['quantity'];
        $total = $quantity * SubscriptionAddon::INSPECTOR_PRICE;

        DB::transaction(function () use ($request, $companyId, $subscription, $quantity, $total) {
            // billed as pending: the system admin confirms it when the money is received
            $payment = Payments::create([
                'subscriber_type' => 'company',
                'subscriber_id' => $companyId,
                'company_id' => $companyId,
                'subscription_id' => $subscription?->id,
                'total_amount' => $total,
                'payment_type' => 'addon_inspector',
                'payment_status' => 'pending',
                'cash_flow' => 'cash_in',
            ]);

            SubscriptionAddon::create([
                'company_id' => $companyId,
                'subscription_id' => $subscription?->id,
                'type' => 'inspector',
                'quantity' => $quantity,
                'unit_price' => SubscriptionAddon::INSPECTOR_PRICE,
                'total_amount' => $total,
                'payment_id' => $payment->id,
                'purchased_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', "{$quantity} extra Inspector seat(s) added (RM " . number_format($total) . '). You can create the accounts now; payment is arranged with Ramzi at 016-8865619.');
    }

    public function approve(SubscriptionPlanRequest $planRequest)
    {
        DB::transaction(function () use ($planRequest) {
            $planRequest = SubscriptionPlanRequest::whereKey($planRequest->id)->lockForUpdate()->firstOrFail();
            if ($planRequest->status !== 'pending') {
                throw ValidationException::withMessages(['request' => 'This request has already been reviewed.']);
            }

            $module = Module::where('code', 'SB360-WSIS')->firstOrFail();
            if (self::hasActiveSafety((int) $planRequest->company_id)) {
                throw ValidationException::withMessages(['request' => 'This company already has an active Safety Buddy subscription.']);
            }
            $hasPreviousSafety = SubscriptionsCompany::where('company_id', $planRequest->company_id)
                ->where('module_id', $module->id)->exists();
            $subscription = \App\Support\SeriesCodes::createSubscription((int) $planRequest->company_id, [
                'company_id' => $planRequest->company_id,
                'module_id' => $module->id,
                'subscription_plan_id' => $planRequest->plan_id,
                'start_date' => today(),
                'end_date' => today()->addYear()->subDay(),
                'status' => 'active',
                'type' => $hasPreviousSafety ? 'renew' : 'new',
            ]);

            Payments::create([
                'subscriber_type' => 'company',
                'subscriber_id' => $planRequest->company_id,
                'company_id' => $planRequest->company_id,
                'subscription_id' => $subscription->id,
                'total_amount' => $planRequest->price_yearly,
                'payment_type' => 'manual_verified',
                'payment_status' => 'completed',
                'cash_flow' => 'cash_in',
            ]);

            $planRequest->update(['status' => 'approved', 'subscription_id' => $subscription->id, 'reviewed_at' => now()]);
        });

        return back()->with('success', 'Payment confirmed and subscription activated.');
    }

    public function reject(SubscriptionPlanRequest $planRequest)
    {
        if ($planRequest->status !== 'pending') {
            throw ValidationException::withMessages(['request' => 'This request has already been reviewed.']);
        }
        $planRequest->update(['status' => 'rejected', 'reviewed_at' => now()]);

        return back()->with('success', 'Purchase request rejected.');
    }

    public function storePlan(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:subscription_plans,code'],
            'name' => ['required', 'string', 'max:100'],
            'price_yearly' => ['required', 'integer', 'min:0'],
            'manager_limit' => ['required', 'integer', 'min:0'],
            'supervisor_limit' => ['required', 'integer', 'min:0'],
            'inspector_limit' => ['required', 'integer', 'min:0'],
            'daily_pdf_limit' => ['nullable', 'integer', 'min:0'],
            'monthly_pdf_limit' => ['nullable', 'integer', 'min:0'],
        ]);
        $validated['sort_order'] = (SubscriptionPlan::max('sort_order') ?? 0) + 1;
        $validated['is_active'] = true;
        SubscriptionPlan::create($validated);

        return back()->with('success', 'Subscription plan created.');
    }
}
