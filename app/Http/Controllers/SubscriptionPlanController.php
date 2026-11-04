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

    /** A company counts as a Training Provider while it holds an active Training Provider package; the reference code is issued when its payment is confirmed. */
    public static function findTrainingProvider(string $code, int $exceptCompanyId = 0): ?\App\Models\Company
    {
        $code = trim($code);
        if ($code === '') {
            return null;
        }

        return \App\Models\Company::where('reference_code', strtoupper($code))
            ->where('id', '!=', $exceptCompanyId)
            ->whereHas('subscriptions', fn ($query) => $query
                ->where('status', 'active')
                ->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())
                ->whereHas('plan', fn ($plan) => $plan->where('audience', 'training_provider')))
            ->first();
    }

    /**
     * The reference code only links a company to its Training Provider (it activates no package).
     * Which company used which code is recorded on the company: the provider and the time it was linked.
     */
    public function linkReferenceCode(Request $request)
    {
        abort_unless((int) $request->user()->role_id === 2, 403, 'Only the company admin can use a reference code.');
        $validated = $request->validate(['code' => ['required', 'string', 'max:50']]);
        $company = $request->user()->company;
        abort_unless($company, 403, 'No company is linked to your account.');

        if ($company->training_provider_company_id) {
            throw ValidationException::withMessages(['code' => 'Your company is already registered under a Training Provider.']);
        }
        if ((int) $company->account_type_id === \App\Models\AccountType::TRAINING_PROVIDER) {
            throw ValidationException::withMessages(['code' => 'A Training Provider cannot register under another provider.']);
        }

        $provider = self::findTrainingProvider($validated['code'], (int) $company->id);
        if (! $provider) {
            throw ValidationException::withMessages(['code' => 'Reference code not found or no longer active. Check the code with your Training Provider.']);
        }

        $company->update([
            'account_type_id' => \App\Models\AccountType::UNDER_TRAINING_PROVIDER,
            'training_provider_company_id' => $provider->id,
            'provider_linked_at' => now(),
        ]);

        return redirect()->route('subscription.plans')->with('success', "Your company is now registered under {$provider->name}.");
    }

    public function checkReferenceCode(Request $request)
    {
        $validated = $request->validate(['code' => ['required', 'string', 'max:50']]);
        $provider = self::findTrainingProvider($validated['code'], (int) $request->user()->company_id);

        if (! $provider) {
            return response()->json(['valid' => false, 'message' => 'Reference code not found. Check the code with your Training Provider.'], 422);
        }

        return response()->json(['valid' => true, 'provider' => $provider->name]);
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

        // This page is for buying a first package (or renewing an expired one). A company with a running package
        // manages it elsewhere, so it is sent there instead of seeing the purchase options again.
        if (self::hasActiveSafety((int) $companyId)) {
            $role = (int) $request->user()->role_id;

            return redirect()->to(match (true) {
                $role === 2 => route('manage.package'),
                in_array($role, [3, 4], true) => '/review/dashboard',
                default => '/inspector/dashboard',
            });
        }

        $details = self::detailsForCompany((int) $companyId);

        return Inertia::render('Subscription/Plans', [
            'plans' => SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get(),
            'linkedProvider' => $request->user()->company?->trainingProvider ? [
                'name' => $request->user()->company->trainingProvider->name,
                'linked_at' => $request->user()->company->provider_linked_at?->toDateString(),
            ] : null,
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
            'trainingApplication' => \App\Models\TrainingProviderApplication::with('certificates:id,application_id,issuing_body,expiry_date,file_name')
                ->where('company_id', $companyId)->latest('id')->first(),
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
            ->whereNotIn('payment_type', ['addon_inspector', 'addon_executor'])
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
                // the end date is the last valid day, so today counts: the last day shows 1 day left, not 0
                'days_remaining' => $active ? (int) today()->diffInDays($subscription->end_date, false) + 1 : null,
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
        if ($plan->audience === 'training_provider') {
            throw ValidationException::withMessages(['plan_id' => 'The Training Provider package is requested through the Training Provider application.']);
        }
        // companies registered under a Training Provider use the Contractor Training Provider package; everyone else uses the standard plans
        $underProvider = (bool) $request->user()->company?->training_provider_company_id;
        if ($plan->audience === 'contractor_provider' && ! $underProvider) {
            throw ValidationException::withMessages(['plan_id' => 'This package is only for companies registered under a Training Provider.']);
        }
        if ($underProvider && $plan->audience !== 'contractor_provider') {
            throw ValidationException::withMessages(['plan_id' => 'Companies registered under a Training Provider use the Contractor Training Provider package.']);
        }
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

            // payment confirmed: this is when the company's account type is fixed
            $plan = SubscriptionPlan::find($planRequest->plan_id);
            if ($plan?->audience === 'training_provider') {
                $provider = \App\Models\Company::findOrFail($planRequest->company_id);
                $provider->update(['account_type_id' => \App\Models\AccountType::TRAINING_PROVIDER]);
                $provider->ensureReferenceCode();
            } elseif ($planRequest->training_provider_company_id) {
                \App\Models\Company::whereKey($planRequest->company_id)->update([
                    'account_type_id' => \App\Models\AccountType::UNDER_TRAINING_PROVIDER,
                    'training_provider_company_id' => $planRequest->training_provider_company_id,
                ]);
            }

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

    public function createPlan()
    {
        return Inertia::render('Admin/PlanCreate', ['title' => 'Add Safety Buddy Plan']);
    }

    public function storePlan(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:subscription_plans,code'],
            'name' => ['required', 'string', 'max:100'],
            'price_yearly' => ['required', 'integer', 'min:0'],
            'provider_price_yearly' => ['nullable', 'integer', 'min:0'],
            'manager_limit' => ['required', 'integer', 'min:0'],
            'supervisor_limit' => ['required', 'integer', 'min:0'],
            'inspector_limit' => ['required', 'integer', 'min:0'],
            'contractor_limit' => ['required', 'integer', 'min:0'],
            'daily_pdf_limit' => ['nullable', 'integer', 'min:0'],
            'monthly_pdf_limit' => ['nullable', 'integer', 'min:0'],
        ]);
        $validated['sort_order'] = (SubscriptionPlan::max('sort_order') ?? 0) + 1;
        $validated['is_active'] = true;
        $plan = SubscriptionPlan::create($validated);

        return redirect()->route('system.admin.plans.show', $plan)->with('success', 'Subscription plan created.');
    }

    public function showPlan(SubscriptionPlan $subscriptionPlan)
    {
        return Inertia::render('Admin/PlanDetails', [
            'title' => $subscriptionPlan->name,
            'plan' => $subscriptionPlan,
            'usage' => [
                'subscriptions' => SubscriptionsCompany::where('subscription_plan_id', $subscriptionPlan->id)->count(),
                'active_subscriptions' => SubscriptionsCompany::where('subscription_plan_id', $subscriptionPlan->id)
                    ->where('status', 'active')->whereDate('start_date', '<=', today())->whereDate('end_date', '>=', today())->count(),
                'pending_requests' => SubscriptionPlanRequest::where('plan_id', $subscriptionPlan->id)->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function editPlan(SubscriptionPlan $subscriptionPlan)
    {
        return Inertia::render('Admin/PlanEdit', [
            'title' => 'Edit '.$subscriptionPlan->name,
            'plan' => $subscriptionPlan,
        ]);
    }

    public function updatePlan(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'price_yearly' => ['required', 'integer', 'min:0'],
            'provider_price_yearly' => ['nullable', 'integer', 'min:0'],
            'manager_limit' => ['required', 'integer', 'min:0', 'max:65535'],
            'supervisor_limit' => ['required', 'integer', 'min:0', 'max:65535'],
            'inspector_limit' => ['required', 'integer', 'min:0', 'max:65535'],
            'contractor_limit' => ['required', 'integer', 'min:0', 'max:65535'],
            'daily_pdf_limit' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'monthly_pdf_limit' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:65535'],
        ]);

        $subscriptionPlan->update($validated);

        return redirect()->route('system.admin.plans.show', $subscriptionPlan)->with('success', 'Safety Buddy plan updated.');
    }
}
