<?php

namespace App\Http\Controllers;

use App\Models\AccountType;
use App\Models\Company;
use App\Models\Module;
use App\Models\PackageActivationCode;
use App\Models\Payments;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubscriptionsCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * A Training Provider buys packages for the companies under it. Each package bought is one activation code:
 * created at purchase, usable once an admin confirms payment, redeemed by a company to activate its subscription.
 */
class ProviderPackageController extends Controller
{
    /** The only plan a Training Provider buys for companies under it. Standard plans are not sold here. */
    private const SELLABLE_AUDIENCES = ['contractor_provider'];

    /** A package can be renewed this many days before it ends, or any time after it has ended. */
    private const RENEW_WINDOW_DAYS = 90;

    private function provider(Request $request): Company
    {
        $company = $request->user()->company;
        abort_unless($company && (int) $company->account_type_id === AccountType::TRAINING_PROVIDER, 403, 'Only Training Providers can open this page.');

        return $company;
    }

    /** Plan menu: buy a package or renew one. */
    public function index(Request $request)
    {
        return $this->page($request, 'plan');
    }

    /** Log menu: the purchase log and the activation codes. */
    public function codes(Request $request)
    {
        return $this->page($request, 'log');
    }

    private function page(Request $request, string $section)
    {
        $provider = $this->provider($request);
        $tabs = $section === 'plan' ? ['purchase', 'renew'] : ['log', 'codes'];
        $tab = in_array($request->query('tab'), $tabs, true) ? $request->query('tab') : $tabs[0];
        $listTab = in_array($tab, ['log', 'codes'], true);
        $allowed = $tab === 'codes' ? ['available', 'used'] : ['pending', 'available', 'used', 'rejected'];
        $status = $listTab && in_array($request->query('status'), $allowed, true) ? $request->query('status') : null;
        $type = $tab === 'log' && in_array($request->query('type'), ['purchase', 'renewal'], true) ? $request->query('type') : null;

        // the order rows are only needed on the two list tabs; "log" shows every order, "codes" only the paid ones
        $codes = ! $listTab ? null : PackageActivationCode::with(['plan:id,name', 'usedBy:id,name', 'renewalFor:id,name'])
            ->where('provider_company_id', $provider->id)
            ->when($tab === 'codes', fn ($query) => $query->whereIn('status', ['available', 'used']))
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($type === 'renewal', fn ($query) => $query->whereNotNull('renewal_for_company_id'))
            ->when($type === 'purchase', fn ($query) => $query->whereNull('renewal_for_company_id'))
            ->latest('id')->paginate(10)->withQueryString()
            ->through(fn (PackageActivationCode $code) => [
                'id' => $code->id,
                'batch_ref' => $code->batch_ref,
                // the code itself is only handed out once the order is paid
                'code' => in_array($code->status, ['available', 'used'], true) ? $code->code : null,
                'package' => $code->plan?->name,
                'type' => $code->renewal_for_company_id ? 'renewal' : 'purchase',
                'renewal_for' => $code->renewalFor?->name,
                'price' => $code->price_yearly,
                'status' => $code->status,
                'used_by' => $code->usedBy?->name,
                'created_at' => $code->created_at?->format('Y-m-d'),
                'used_at' => $code->used_at?->format('Y-m-d'),
            ]);

        return Inertia::render('Company/ProviderPackages', [
            'section' => $section,
            'tab' => $tab,
            'codes' => $codes,
            'status' => $status,
            'type' => $type,
            'plans' => SubscriptionPlan::where('is_active', true)->whereIn('audience', self::SELLABLE_AUDIENCES)->orderBy('sort_order')->get()
                ->map(fn (SubscriptionPlan $plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => (int) ($plan->provider_price_yearly ?? $plan->price_yearly),
                    'normal_price' => (int) $plan->price_yearly,
                    'manager_limit' => $plan->manager_limit,
                    'supervisor_limit' => $plan->supervisor_limit,
                    'inspector_limit' => $plan->inspector_limit,
                    'contractor_limit' => $plan->contractor_limit,
                    'daily_pdf_limit' => $plan->daily_pdf_limit,
                    'monthly_pdf_limit' => $plan->monthly_pdf_limit,
                ])->values(),
            'trainees' => $this->renewalTrainees($provider),
            'renewWindowDays' => self::RENEW_WINDOW_DAYS,
            'counts' => PackageActivationCode::where('provider_company_id', $provider->id)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status'),
            'typeCounts' => PackageActivationCode::where('provider_company_id', $provider->id)->selectRaw("IF(renewal_for_company_id IS NULL, 'purchase', 'renewal') as kind, COUNT(*) as total")->groupBy('kind')->pluck('total', 'kind'),
        ]);
    }

    /** Companies registered under this provider, with where their package stands and whether it can be renewed now. */
    private function renewalTrainees(Company $provider): array
    {
        return Company::where('training_provider_company_id', $provider->id)->orderBy('name')->get(['id', 'name'])
            ->map(function (Company $trainee) {
                $subscription = SubscriptionsCompany::where('company_id', $trainee->id)
                    ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
                    ->latest('end_date')->first();
                $daysLeft = $subscription ? (int) today()->diffInDays($subscription->end_date, false) : null;
                $state = ! $subscription ? 'no_package' : ($daysLeft < 0 ? 'expired' : 'active');

                return [
                    'id' => $trainee->id,
                    'name' => $trainee->name,
                    'state' => $state,
                    'end_date' => $subscription?->end_date?->format('Y-m-d'),
                    'days_left' => $daysLeft,
                    'can_renew' => $daysLeft === null || $daysLeft <= self::RENEW_WINDOW_DAYS,
                ];
            })->values()->all();
    }

    public function store(Request $request)
    {
        $provider = $this->provider($request);
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:subscription_plans,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'company_id' => ['nullable', 'integer'],
        ]);
        $plan = SubscriptionPlan::whereKey($validated['plan_id'])->where('is_active', true)->whereIn('audience', self::SELLABLE_AUDIENCES)->firstOrFail();
        $price = (int) ($plan->provider_price_yearly ?? $plan->price_yearly);
        $batch = 'ORD-'.now()->format('ymd').'-'.Str::upper(Str::random(4));

        // a renewal is bought for one specific company of this provider, and only that company can use the code
        $renewal = null;
        if (! empty($validated['company_id'])) {
            $renewal = collect($this->renewalTrainees($provider))->firstWhere('id', (int) $validated['company_id']);
            if (! $renewal) {
                throw ValidationException::withMessages(['company_id' => 'Choose a company registered under you.']);
            }
            if (! $renewal['can_renew']) {
                throw ValidationException::withMessages(['company_id' => "{$renewal['name']} can be renewed within ".self::RENEW_WINDOW_DAYS." days of its expiry date ({$renewal['end_date']})."]);
            }
            $validated['quantity'] = 1;
        }

        DB::transaction(function () use ($validated, $provider, $plan, $price, $batch, $request, $renewal) {
            for ($i = 0; $i < $validated['quantity']; $i++) {
                PackageActivationCode::create([
                    'batch_ref' => $batch,
                    'code' => PackageActivationCode::generateCode($provider),
                    'provider_company_id' => $provider->id,
                    'renewal_for_company_id' => $renewal['id'] ?? null,
                    'plan_id' => $plan->id,
                    'price_yearly' => $price,
                    'status' => 'pending',
                    'requested_by' => $request->user()->id,
                ]);
            }
        });

        $total = number_format($price * $validated['quantity']);

        $for = $renewal ? " (renewal for {$renewal['name']})" : '';

        return back()->with('success', "Order {$batch} sent{$for}: {$validated['quantity']} × {$plan->name}, RM {$total}. Contact Ramzi at 016-8865619 to arrange payment. Your activation code(s) appear here once payment is confirmed.");
    }

    /** A company activates its package with an activation code a Training Provider bought for it. */
    public function redeem(Request $request)
    {
        abort_unless((int) $request->user()->role_id === 2, 403, 'Only the company admin can use an activation code.');
        $validated = $request->validate(['code' => ['required', 'string', 'max:50']]);
        $company = $request->user()->company;
        abort_unless($company, 403, 'No company is linked to your account.');

        if ((int) $company->account_type_id === AccountType::TRAINING_PROVIDER) {
            throw ValidationException::withMessages(['code' => 'A Training Provider cannot use an activation code.']);
        }

        // A new package starts today. A package that is still running can be renewed close to its end: the renewal
        // starts the day after the current one ends, so no days are lost.
        $latestEnd = SubscriptionsCompany::where('company_id', $company->id)->where('status', 'active')
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))->max('end_date');
        $start = today();
        if ($latestEnd && Carbon::parse($latestEnd)->gte(today())) {
            $ends = Carbon::parse($latestEnd);
            if (! $company->training_provider_company_id) {
                throw ValidationException::withMessages(['code' => 'Your Safety Buddy subscription is already active.']);
            }
            if (today()->diffInDays($ends) > self::RENEW_WINDOW_DAYS) {
                throw ValidationException::withMessages(['code' => 'Your package runs until '.$ends->format('j M Y').'. You can renew it within '.self::RENEW_WINDOW_DAYS.' days of that date.']);
            }
            $start = $ends->copy()->addDay();
        }

        DB::transaction(function () use ($validated, $company, $request, $start) {
            $code = PackageActivationCode::where('code', strtoupper(trim($validated['code'])))->lockForUpdate()->first();
            if (! $code || $code->status !== 'available') {
                throw ValidationException::withMessages(['code' => 'This activation code is not valid or has already been used.']);
            }
            if ($company->training_provider_company_id && (int) $company->training_provider_company_id !== (int) $code->provider_company_id) {
                throw ValidationException::withMessages(['code' => 'Your company is registered under a different Training Provider.']);
            }
            if ($code->renewal_for_company_id && (int) $code->renewal_for_company_id !== (int) $company->id) {
                throw ValidationException::withMessages(['code' => 'This activation code was issued for a different company.']);
            }

            $module = Module::where('code', 'SB360-WSIS')->firstOrFail();
            $hasPreviousSafety = SubscriptionsCompany::where('company_id', $company->id)->where('module_id', $module->id)->exists();
            $subscription = \App\Support\SeriesCodes::createSubscription((int) $company->id, [
                'company_id' => $company->id,
                'module_id' => $module->id,
                'subscription_plan_id' => $code->plan_id,
                'start_date' => $start->toDateString(),
                'end_date' => $start->copy()->addYear()->subDay()->toDateString(),
                'status' => 'active',
                'type' => $hasPreviousSafety ? 'renew' : 'new',
            ]);

            // the provider paid for this package, so there is no payment record on the company
            SubscriptionPlanRequest::create([
                'company_id' => $company->id,
                'training_provider_company_id' => $code->provider_company_id,
                'plan_id' => $code->plan_id,
                'price_yearly' => $code->price_yearly,
                'status' => 'approved',
                'subscription_id' => $subscription->id,
                'requested_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $company->update([
                'account_type_id' => AccountType::UNDER_TRAINING_PROVIDER,
                'training_provider_company_id' => $code->provider_company_id,
                'provider_linked_at' => $company->provider_linked_at ?? now(),
            ]);
            $code->update(['status' => 'used', 'used_by_company_id' => $company->id, 'used_at' => now()]);
        });

        // the package is live, so skip the plans page and go straight to the dashboard
        return redirect()->route('dashboard.inspection')->with('success', 'Your package is active. It was paid for by your Training Provider.');
    }

    /** System admin: confirm the provider's payment for a whole order. */
    public function approveOrder(string $batch)
    {
        DB::transaction(function () use ($batch) {
            $codes = PackageActivationCode::where('batch_ref', $batch)->lockForUpdate()->get();
            if ($codes->isEmpty() || $codes->contains(fn ($code) => $code->status !== 'pending')) {
                throw ValidationException::withMessages(['order' => 'This order has already been reviewed.']);
            }

            Payments::create([
                'subscriber_type' => 'company',
                'subscriber_id' => $codes->first()->provider_company_id,
                'company_id' => $codes->first()->provider_company_id,
                'subscription_id' => null,
                'total_amount' => $codes->sum('price_yearly'),
                'payment_type' => 'activation_code_order',
                'payment_status' => 'completed',
                'cash_flow' => 'cash_in',
            ]);
            PackageActivationCode::where('batch_ref', $batch)->update(['status' => 'available', 'paid_at' => now()]);
        });

        return back()->with('success', 'Payment confirmed. The activation codes are now available to the Training Provider.');
    }

    public function rejectOrder(string $batch)
    {
        $updated = PackageActivationCode::where('batch_ref', $batch)->where('status', 'pending')->update(['status' => 'rejected']);
        if (! $updated) {
            throw ValidationException::withMessages(['order' => 'This order has already been reviewed.']);
        }

        return back()->with('success', 'Order rejected.');
    }
}
