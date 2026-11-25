<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;

use App\Models\Company;
use App\Models\AccountType;
use App\Models\CompanyStaff;
use App\Models\Manhour;
use App\Models\Module;
use App\Models\Payments;
use App\Models\Project;
use App\Models\Role;
use App\Models\SubscriptionsCompany;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubconCompany;
use App\Models\User;
use App\Services\CompanySeatLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SystemAdminController extends Controller
{
    public function companies(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'integer', 'exists:account_types,id'],
        ]);
        $search = trim($filters['search'] ?? '');

        $companies = Company::query()
            ->with(['accountType:id,name', 'trainingProvider:id,name'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('registration_no', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereIn('id', User::query()->select('company_id')->where('role_id', UserRole::CompanyAdmin->value)
                            ->where(function ($users) use ($search) {
                                $users->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            }));
                });
            })
            ->when(! empty($filters['type']), fn ($query) => $query->where('account_type_id', $filters['type']))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        $companyIds = $companies->getCollection()->pluck('id');
        $admins = User::query()->whereIn('company_id', $companyIds)->where('role_id', UserRole::CompanyAdmin->value)
            ->orderBy('id')->get(['id', 'company_id', 'name', 'email', 'phone', 'email_verified_at'])
            ->groupBy('company_id');
        $subscriptions = SubscriptionsCompany::query()->whereIn('company_id', $companyIds)
            ->with(['module:id,name,code', 'plan:id,name'])
            ->orderByDesc('end_date')->orderByDesc('id')->get()->groupBy('company_id');

        $companies->setCollection($companies->getCollection()->map(function (Company $company) use ($admins, $subscriptions) {
            $records = $subscriptions->get($company->id, collect());
            $current = $records->first(fn ($item) => in_array($item->status, ['active', 'trial'], true)
                && $item->start_date?->lte(today()) && $item->end_date?->gte(today())) ?? $records->first();

            return [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
                'email' => $company->email,
                'contact' => $company->contact,
                'status' => $company->status,
                'logo_url' => $company->logo_url,
                'account_type' => $company->accountType?->name ?? 'Unassigned',
                'training_provider' => $company->trainingProvider?->name,
                'admins' => $admins->get($company->id, collect())->map->only(['id', 'name', 'email'])->values(),
                'subscription' => $current ? $this->companySubscriptionData($current) : null,
                'subscription_count' => $records->count(),
            ];
        }));

        return Inertia::render('Admin/System/Companies', [
            'title' => 'Companies',
            'companies' => $companies,
            'accountTypes' => AccountType::orderBy('sort_order')->get(['id', 'name']),
            'filters' => ['search' => $search, 'type' => (string) ($filters['type'] ?? '')],
            'totalCompanies' => Company::count(),
        ]);
    }

    public function showCompany(Company $company)
    {
        $company->load(['accountType:id,name', 'trainingProvider:id,name,email,contact']);
        $admins = User::query()->where('company_id', $company->id)->where('role_id', UserRole::CompanyAdmin->value)
            ->orderBy('name')->get(['id', 'name', 'email', 'phone', 'created_at', 'email_verified_at']);
        $subscriptions = $company->subscriptions()->with(['module:id,name,code,price', 'plan:id,name,price_yearly'])
            ->orderByDesc('end_date')->orderByDesc('id')->get();
        $staff = CompanyStaff::where('company_id', $company->id)->with('role:id,name,display_name')->orderBy('name')->get();
        $directEmployees = User::where('company_id', $company->id)->whereIn('role_id', UserRole::staffIds())
            ->when($staff->pluck('user_id')->filter()->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $staff->pluck('user_id')->filter()->all()))
            ->with('role:id,name,display_name')->orderBy('name')->get();
        $contractors = SubconCompany::where('company_id', $company->id)->with('subconStaff')->orderBy('name')->get();
        $linkedCompanies = (int) $company->account_type_id === AccountType::TRAINING_PROVIDER
            ? $company->trainees()->with(['accountType:id,name', 'subscriptions' => fn ($query) => $query
                ->with('plan:id,name')->orderByDesc('end_date')->orderByDesc('id')])
                ->orderBy('name')->paginate(20)->through(function (Company $linked) {
                    $current = $linked->subscriptions->first(fn ($item) => $item->status === 'active'
                        && $item->start_date?->lte(today()) && $item->end_date?->gte(today())) ?? $linked->subscriptions->first();

                    return [
                        'id' => $linked->id,
                        'name' => $linked->name,
                        'code' => $linked->code,
                        'account_type' => $linked->accountType?->name,
                        'email' => $linked->email,
                        'contact' => $linked->contact,
                        'status' => $linked->status,
                        'linked_at' => $linked->provider_linked_at?->format('Y-m-d'),
                        'package' => $current?->plan?->name,
                        'subscription_status' => $current?->status,
                    ];
                })
            : null;

        return Inertia::render('Admin/System/CompanyDetails', [
            'title' => $company->name,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
                'reference_code' => $company->reference_code,
                'registration_no' => $company->registration_no,
                'email' => $company->email,
                'contact' => $company->contact,
                'address' => $company->address,
                'city' => $company->city,
                'postcode' => $company->postcode,
                'state' => $company->state,
                'status' => $company->status,
                'logo_url' => $company->logo_url,
                'account_type' => $company->accountType?->name ?? 'Unassigned',
                'is_training_provider' => (int) $company->account_type_id === AccountType::TRAINING_PROVIDER,
                'training_provider' => $company->trainingProvider?->only(['id', 'name', 'email', 'contact']),
                'provider_linked_at' => $company->provider_linked_at?->format('Y-m-d'),
                'created_at' => $company->created_at?->format('Y-m-d'),
            ],
            'admins' => $admins,
            'subscriptions' => $subscriptions->map(fn ($subscription) => $this->companySubscriptionData($subscription))->values(),
            'slots' => CompanySeatLimits::snapshot($company->id),
            'employees' => $staff->map(fn ($person) => [
                'id' => 'staff-'.$person->id,
                'name' => $person->name,
                'code' => $person->code,
                'role' => $person->role?->display_name ?? $person->role?->name,
                'email' => $person->email,
                'contact' => $person->contact,
                'status' => $person->status,
            ])->concat($directEmployees->map(fn ($person) => [
                'id' => 'user-'.$person->id,
                'name' => $person->name,
                'code' => null,
                'role' => $person->role?->display_name ?? $person->role?->name,
                'email' => $person->email,
                'contact' => $person->phone,
                'status' => null,
            ]))->values(),
            'contractors' => $contractors->map(fn ($contractor) => [
                'id' => $contractor->id,
                'name' => $contractor->name,
                'code' => $contractor->code,
                'email' => $contractor->email,
                'contact' => $contractor->contact,
                'address' => $contractor->address,
                'status' => $contractor->status,
                'staff' => $contractor->subconStaff->map->only(['id', 'name', 'code', 'role', 'email', 'contact', 'status'])->values(),
            ])->values(),
            'linkedCompanies' => $linkedCompanies,
        ]);
    }

    private function companySubscriptionData(SubscriptionsCompany $subscription): array
    {
        return [
            'id' => $subscription->id,
            'code' => $subscription->code,
            'module' => $subscription->module?->name ?? 'Legacy package',
            'module_code' => $subscription->module?->code,
            'plan' => $subscription->plan?->name,
            'price' => $subscription->plan?->price_yearly ?? $subscription->module?->price,
            'status' => $subscription->status,
            'display_status' => in_array($subscription->status, ['active', 'trial'], true) && $subscription->end_date?->lt(today())
                ? 'expired'
                : (in_array($subscription->status, ['active', 'trial'], true) && $subscription->start_date?->gt(today()) ? 'upcoming' : $subscription->status),
            'type' => $subscription->type,
            'start_date' => $subscription->start_date?->format('Y-m-d'),
            'end_date' => $subscription->end_date?->format('Y-m-d'),
        ];
    }

    public function dashboard()
    {
        return Inertia::render('Admin/System/System_Dashboard', [
            'title' => 'System Administration',
            'paymentCards' => $this->paymentCards(),
            'approvals' => $this->pendingApprovals(),
            'charts' => $this->activityCharts(),
        ]);
    }

    public function users()
    {
        return Inertia::render('Admin/System/Users', [
            'title' => 'Users',
            'users' => User::with(['role:id,display_name,name', 'company:id,name'])
                ->latest('created_at')
                ->get(['id', 'name', 'email', 'phone', 'company_id', 'role_id', 'created_at']),
            'roles' => Role::orderBy('id')->get(['id', 'name', 'display_name']),
            'companies' => Company::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function createUser()
    {
        return Inertia::render('Admin/System/UserCreate', [
            'title' => 'Create user',
            'roles' => Role::orderBy('id')->get(['id', 'name', 'display_name']),
            'companies' => Company::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Confirmed payments since $from, each tagged with the plan audience so they can be split by who bought what. */
    private function confirmedPayments($from)
    {
        return DB::table('payments as p')
            ->leftJoin('subscriptions_company as s', 's.id', '=', 'p.subscription_id')
            ->leftJoin('subscription_plans as sp', 'sp.id', '=', 's.subscription_plan_id')
            ->where('p.payment_status', 'completed')
            ->where('p.created_at', '>=', $from)
            ->get(['p.created_at', 'p.total_amount', 'p.payment_type', 'sp.audience'])
            ->map(function ($row) { $row->created_at = Carbon::parse($row->created_at); return $row; });
    }

    /** Slot add-ons are not in the confirmed list: they are billed when bought, so they come from their own table. */
    private function paymentCategory(object $payment): ?string
    {
        if (str_starts_with((string) $payment->payment_type, 'addon_')) {
            return null;
        }
        if ($payment->payment_type === 'activation_code_order') {
            return 'provider_orders';
        }

        return $payment->audience === 'training_provider' ? 'provider_plan' : 'standard';
    }

    /** This month's money in, by who bought, with last month beside it. Extra slots also report how many seats were sold. */
    private function paymentCards(): array
    {
        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->startOfMonth()->subMonth();
        $sum = ['standard' => [0, 0], 'provider_plan' => [0, 0], 'provider_orders' => [0, 0]];

        foreach ($this->confirmedPayments($lastMonth) as $payment) {
            $category = $this->paymentCategory($payment);
            if ($category) {
                $sum[$category][$payment->created_at >= $thisMonth ? 0 : 1] += (float) $payment->total_amount;
            }
        }

        $addons = DB::table('subscription_addons')->whereNotIn('payment_id', fn ($q) => $q->select('id')->from('payments')->where('payment_status', 'failed'))->where('created_at', '>=', $lastMonth)->get(['type', 'quantity', 'total_amount', 'created_at'])->map(function ($row) { $row->created_at = Carbon::parse($row->created_at); return $row; });
        $current = $addons->filter(fn ($row) => $row->created_at >= $thisMonth);
        $slotAmount = [(float) $current->sum('total_amount'), (float) $addons->filter(fn ($row) => $row->created_at < $thisMonth)->sum('total_amount')];

        return [
            'month' => $thisMonth->format('F Y'),
            'cards' => [
                ['key' => 'standard', 'label' => 'Standard package', 'hint' => 'Companies buying a package directly', 'amount' => $sum['standard'][0], 'previous' => $sum['standard'][1]],
                ['key' => 'provider_plan', 'label' => 'Training Provider plan', 'hint' => 'Providers buying their own plan', 'amount' => $sum['provider_plan'][0], 'previous' => $sum['provider_plan'][1]],
                ['key' => 'provider_orders', 'label' => 'Packages bought by providers', 'hint' => 'Activation code orders', 'amount' => $sum['provider_orders'][0], 'previous' => $sum['provider_orders'][1]],
                [
                    'key' => 'slots', 'label' => 'Extra user slots', 'hint' => 'Inspector and contractor seats sold',
                    'amount' => $slotAmount[0], 'previous' => $slotAmount[1],
                    'slots' => ['inspector' => (int) $current->where('type', 'inspector')->sum('quantity'), 'contractor' => (int) $current->where('type', 'executor')->sum('quantity')],
                ],
            ],
        ];
    }

    /** What only the system admin can act on, with how long the oldest has been waiting. */
    private function pendingApprovals(): array
    {
        $pending = fn (string $table) => [DB::table($table)->where('status', 'pending')->count(), DB::table($table)->where('status', 'pending')->min('created_at')];
        [$requests, $requestsOldest] = $pending('subscription_plan_requests');
        [$applications, $applicationsOldest] = $pending('training_provider_applications');
        $orders = DB::table('package_activation_codes')->where('status', 'pending')->distinct()->count('batch_ref');
        $ordersOldest = DB::table('package_activation_codes')->where('status', 'pending')->min('created_at');

        $slots = DB::table('payments')->whereIn('payment_type', ['addon_inspector', 'addon_executor'])->where('payment_status', 'pending');
        $slotsCount = (clone $slots)->count();
        $slotsOldest = (clone $slots)->min('created_at');

        return [
            ['label' => 'Purchase requests', 'hint' => 'Confirm payment to activate a package', 'count' => $requests, 'oldest' => $requestsOldest, 'href' => route('system.admin.approvals')],
            ['label' => 'Training Provider applications', 'hint' => 'Verify registration and certificates', 'count' => $applications, 'oldest' => $applicationsOldest, 'href' => route('system.admin.training-providers.approvals')],
            ['label' => 'Extra slot orders', 'hint' => 'Confirm payment for extra Inspector / Contractor slots', 'count' => $slotsCount, 'oldest' => $slotsOldest, 'href' => route('system.admin.slot-orders')],
            ['label' => 'Package orders', 'hint' => 'Confirm payment to release activation codes', 'count' => $orders, 'oldest' => $ordersOldest, 'href' => route('system.admin.training-providers.orders')],
        ];
    }

    /** Last 8 weeks (Monday to Sunday) and last 6 months of money, new accounts and package purchases, one point per period. */
    private function activityCharts(): array
    {
        $weeks = collect(range(7, 0))->map(function ($ago) {
            $from = now()->startOfWeek()->subWeeks($ago);

            return ['label' => $from->format('j M'), 'from' => $from, 'to' => $from->copy()->endOfWeek()];
        });
        $months = collect(range(5, 0))->map(function ($ago) {
            $from = now()->startOfMonth()->subMonths($ago);

            return ['label' => $from->format('M Y'), 'from' => $from, 'to' => $from->copy()->endOfMonth()];
        });

        $since = $months->first()['from']->lt($weeks->first()['from']) ? $months->first()['from'] : $weeks->first()['from'];
        $payments = $this->confirmedPayments($since);
        $addons = DB::table('subscription_addons')->whereNotIn('payment_id', fn ($q) => $q->select('id')->from('payments')->where('payment_status', 'failed'))->where('created_at', '>=', $since)->get(['total_amount', 'created_at'])->map(function ($row) { $row->created_at = Carbon::parse($row->created_at); return $row; });
        $signups = DB::table('users')->where('role_id', UserRole::CompanyAdmin->value)->where('created_at', '>=', $since)->pluck('created_at')->map(fn ($date) => Carbon::parse($date));

        $build = fn ($buckets) => $buckets->map(function ($bucket) use ($payments, $addons, $signups) {
            $within = fn ($date) => $date >= $bucket['from'] && $date <= $bucket['to'];
            $point = ['label' => $bucket['label'], 'standard' => 0, 'provider_plan' => 0, 'provider_orders' => 0, 'slots' => 0, 'registrations' => 0, 'purchases' => 0];

            foreach ($payments->filter(fn ($payment) => $within($payment->created_at)) as $payment) {
                $category = $this->paymentCategory($payment);
                if ($category) {
                    $point[$category] += (float) $payment->total_amount;
                    $point['purchases']++;
                }
            }
            $point['slots'] = (float) $addons->filter(fn ($addon) => $within($addon->created_at))->sum('total_amount');
            $point['registrations'] = $signups->filter($within)->count();

            return $point;
        })->values()->all();

        return ['weekly' => $build($weeks), 'monthly' => $build($months)];
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:10', 'confirmed'],
            'role_id' => ['required', 'exists:roles,id'],
            'company_id' => ['nullable', 'exists:company,id'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        DB::transaction(function () use ($validated) {
            if (in_array((int) $validated['role_id'], UserRole::staffIds(), true)) {
                if (empty($validated['company_id'])) {
                    throw ValidationException::withMessages(['company_id' => 'Select a company for this employee role.']);
                }
                Company::whereKey($validated['company_id'])->lockForUpdate()->firstOrFail();
                CompanySeatLimits::assertAvailable((int) $validated['company_id'], (int) $validated['role_id']);
            }
            User::create($validated);
        });

        return redirect()->route('system.admin.users.index')->with('success', 'User account created.');
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role_id' => ['required', 'exists:roles,id'],
            'company_id' => ['nullable', 'exists:company,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:10', 'confirmed'],
        ]);

        if ($request->user()->is($user) && (int) $validated['role_id'] !== UserRole::SystemAdmin->value) {
            return back()->withErrors(['role_id' => 'You cannot remove your own System Admin role.']);
        }

        if (CompanyStaff::where('user_id', $user->id)->exists()
            && (! in_array((int) $validated['role_id'], UserRole::staffIds(), true) || empty($validated['company_id']))) {
            return back()->withErrors(['role_id' => 'Linked staff accounts must keep an employee role and company.']);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        DB::transaction(function () use ($user, $validated) {
            $newCompanyId = $validated['company_id'] ?? null;
            $newRoleId = (int) $validated['role_id'];
            $roleOrCompanyChanged = $newRoleId !== (int) $user->role_id || (int) $newCompanyId !== (int) $user->company_id;
            if ($roleOrCompanyChanged && in_array($newRoleId, UserRole::staffIds(), true)) {
                if (! $newCompanyId) {
                    throw ValidationException::withMessages(['company_id' => 'Select a company for this employee role.']);
                }
                Company::whereKey($newCompanyId)->lockForUpdate()->firstOrFail();
                CompanySeatLimits::assertAvailable((int) $newCompanyId, $newRoleId, null, $user->id);
            }
            $user->update($validated);
            CompanyStaff::where('user_id', $user->id)->update([
                'company_id' => $newCompanyId,
                'role_id' => $newRoleId,
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        });

        return redirect()->route('system.admin.users.index')->with('success', 'User account updated.');
    }

    public function subscriptions()
    {
        SubscriptionsCompany::where('status', 'active')
            ->whereDate('end_date', '<', today())
            ->update(['status' => 'expired']);

        $planOrders = SubscriptionPlanRequest::with('plan:id,name')
            ->where('status', 'approved')->whereNotNull('subscription_id')
            ->get()->keyBy('subscription_id');

        $subscriptions = SubscriptionsCompany::with(['company:id,name,code,account_type_id,training_provider_company_id', 'company.accountType:id,name', 'company.trainingProvider:id,name','module:id,code,name,price', 'plan:id,name,price_yearly'])
            ->latest('created_at')
            ->get()
            ->map(fn (SubscriptionsCompany $subscription) => [
                'id' => $subscription->id,
                'company_id' => $subscription->company_id,
                'company_name' => $subscription->company?->name ?? 'Unknown company',
                'company_code' => $subscription->company?->code,
                'account_type_id' => $subscription->company?->account_type_id,
                'account_type' => $subscription->company?->accountType?->name,
                'training_provider_name' => $subscription->company?->trainingProvider?->name,
                'code' => $subscription->code,
                'module_id' => $subscription->module_id,
                'subscription_plan_id' => $subscription->subscription_plan_id,
                'module_name' => $subscription->plan?->name
                    ? 'Safety Buddy - '.$subscription->plan->name
                    : ($planOrders->get($subscription->id)?->plan?->name
                        ? 'Safety Buddy - '.$planOrders->get($subscription->id)->plan->name
                        : ($subscription->module?->name ?? 'Legacy package')),
                'module_code' => $subscription->module?->code,
                'price' => (float) ($planOrders->get($subscription->id)?->price_yearly ?? $subscription->module?->price ?? 0),
                'start_date' => $subscription->start_date?->format('Y-m-d'),
                'end_date' => $subscription->end_date?->format('Y-m-d'),
                'status' => $subscription->status,
                'type' => $subscription->type,
                'created_at' => $subscription->created_at?->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('Admin/System/Subscription_Management', [
            'title' => 'Subscription Management',
            'stats' => [
                'active' => $subscriptions->where('status', 'active')->count(),
                'expiring' => $subscriptions->filter(fn ($subscription) => $subscription['status'] === 'active' && $subscription['end_date'] <= today()->addDays(30)->format('Y-m-d'))->count(),
                'expired' => $subscriptions->where('status', 'expired')->count(),
                'revenue' => $subscriptions->where('status', 'active')->sum('price'),
            ],
            'subscriptions' => $subscriptions,
        ]);
    }

    public function createSubscription(Request $request)
    {
        $renew = $request->filled('renew')
            ? SubscriptionsCompany::with(['company:id,name', 'module:id,name,code', 'plan:id,name'])->findOrFail($request->query('renew'))
            : null;

        return Inertia::render('Admin/System/SubscriptionCreate', [
            'title' => $renew ? 'Renew Subscription' : 'Create Subscription',
            'companies' => Company::orderBy('name')->get(['id', 'name', 'code']),
            'packages' => Module::orderBy('name')->get(['id', 'name', 'code', 'price', 'is_active']),
            'subscriptionPlans' => SubscriptionPlan::where(function ($query) use ($renew) {
                $query->where('is_active', true);
                if ($renew?->subscription_plan_id) {
                    $query->orWhereKey($renew->subscription_plan_id);
                }
            })->orderBy('sort_order')->get(['id', 'name', 'price_yearly', 'manager_limit', 'supervisor_limit', 'inspector_limit']),
            'renew' => $renew ? [
                'id' => $renew->id,
                'company_id' => $renew->company_id,
                'company_name' => $renew->company?->name,
                'module_id' => $renew->module_id,
                'module_name' => $renew->module?->name,
                'subscription_plan_id' => $renew->subscription_plan_id,
                'start_date' => ($renew->end_date?->gte(today()) ? $renew->end_date->copy()->addDay() : today())->format('Y-m-d'),
                'end_date' => ($renew->end_date?->gte(today()) ? $renew->end_date->copy()->addYear() : today()->addYear()->subDay())->format('Y-m-d'),
            ] : null,
        ]);
    }

    public function showSubscription(SubscriptionsCompany $subscription)
    {
        $subscription->load(['company:id,name,code,email,contact,account_type_id', 'company.accountType:id,name', 'module:id,name,code,description,price', 'plan:id,name,price_yearly,manager_limit,supervisor_limit,inspector_limit,contractor_limit']);

        return Inertia::render('Admin/System/SubscriptionDetails', [
            'title' => 'Subscription Details',
            'subscription' => [
                'id' => $subscription->id,
                'code' => $subscription->code,
                'company' => $subscription->company?->only(['id', 'name', 'code', 'email', 'contact']),
                'account_type' => $subscription->company?->accountType?->name,
                'module' => $subscription->module?->only(['id', 'name', 'code', 'description', 'price']),
                'plan' => $subscription->plan?->only(['id', 'name', 'price_yearly', 'manager_limit', 'supervisor_limit', 'inspector_limit', 'contractor_limit']),
                'subscription_plan_id' => $subscription->subscription_plan_id,
                'start_date' => $subscription->start_date?->format('Y-m-d'),
                'end_date' => $subscription->end_date?->format('Y-m-d'),
                'status' => $subscription->status,
                'type' => $subscription->type,
                'created_at' => $subscription->created_at?->format('Y-m-d H:i'),
            ],
            'payments' => Payments::where('subscription_id', $subscription->id)->latest()->get(['id', 'total_amount', 'payment_type', 'payment_status', 'created_at']),
            'subscriptionPlans' => SubscriptionPlan::where(function ($query) use ($subscription) {
                $query->where('is_active', true);
                if ($subscription->subscription_plan_id) {
                    $query->orWhereKey($subscription->subscription_plan_id);
                }
            })->orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function packages()
    {
        return Inertia::render('Admin/System/Packages', [
            'title' => 'Packages',
            'packages' => Module::orderBy('name')->get(['id', 'code', 'name', 'description', 'price', 'is_active']),
            'subscriptionPlans' => SubscriptionPlan::orderBy('sort_order')->get(),
        ]);
    }

    public function createPackage()
    {
        return Inertia::render('Admin/System/PackageForm', ['title' => 'Add Package', 'package' => null]);
    }

    public function editPackage(Module $module)
    {
        return Inertia::render('Admin/System/PackageForm', [
            'title' => 'Edit Package',
            'package' => $module->only(['id', 'code', 'name', 'description', 'price', 'is_active']),
        ]);
    }

    public function approvals()
    {
        return Inertia::render('Admin/System/Approvals', [
            'title' => 'Subscription Approvals',
            'planRequests' => SubscriptionPlanRequest::with(['company:id,name,code', 'plan:id,name,code'])
                ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")->latest()->get(),
        ]);
    }

    public function slotOrders()
    {
        return Inertia::render('Admin/System/SlotOrders', [
            'title' => 'Slot Orders',
            'slotOrders' => \App\Models\SubscriptionAddon::with(['payment:id,payment_status', 'company:id,name,code'])
                ->latest('id')->limit(200)->get()
                ->map(fn ($addon) => [
                    'id' => $addon->id,
                    'order_no' => $addon->order_no,
                    'company' => $addon->company?->name,
                    'company_code' => $addon->company?->code,
                    'type' => $addon->type === 'executor' ? 'Contractor' : 'Inspector',
                    'quantity' => $addon->quantity,
                    'amount' => (float) $addon->total_amount,
                    'status' => match ($addon->payment?->payment_status) { 'completed' => 'approved', 'failed' => 'rejected', default => 'pending' },
                    'created_at' => $addon->created_at?->toDateTimeString(),
                ])->sortBy(fn ($row) => $row['status'] === 'pending' ? 0 : 1)->values(),
        ]);
    }

    public function storeSubscription(Request $request)
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:company,id'],
            'module_id' => ['required', 'exists:modules,id'],
            'subscription_plan_id' => ['nullable', 'exists:subscription_plans,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'trial', 'suspended', 'cancelled'])],
            'type' => ['required', Rule::in(['new', 'renew', 'trial', 'manual'])],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_type' => ['nullable', 'string', 'max:50'],
            'payment_status' => ['nullable', Rule::in(['completed', 'pending', 'failed', 'not_recorded'])],
        ]);

        $isSafetyBuddy = Module::findOrFail($validated['module_id'])->code === 'SB360-WSIS';
        if ($isSafetyBuddy && empty($validated['subscription_plan_id'])) {
            throw ValidationException::withMessages(['subscription_plan_id' => 'Select a Safety Buddy plan to set employee limits.']);
        }

        $subscription = DB::transaction(function () use ($validated, $isSafetyBuddy) {
            $subscription = \App\Support\SeriesCodes::createSubscription((int) $validated['company_id'], [
                'company_id' => $validated['company_id'],
                'module_id' => $validated['module_id'],
                'subscription_plan_id' => $isSafetyBuddy ? $validated['subscription_plan_id'] : null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'status' => $validated['status'],
                'type' => $validated['type'],
            ]);

            if (($validated['payment_status'] ?? 'not_recorded') !== 'not_recorded') {
                $amount = $validated['total_amount'] ?? Module::find($validated['module_id'])->price;
                Payments::create([
                    'subscriber_type' => 'company',
                    'subscriber_id' => $validated['company_id'],
                    'company_id' => $validated['company_id'],
                    'subscription_id' => $subscription->id,
                    'total_amount' => $amount,
                    'payment_type' => $validated['payment_type'] ?? 'manual',
                    'payment_status' => $validated['payment_status'],
                    'cash_flow' => 'cash_in',
                ]);
            }

            return $subscription;
        });

        return redirect()->route('system.admin.subscriptions.show', $subscription)->with('success', 'Subscription period created.');
    }

    public function updateSubscription(Request $request, SubscriptionsCompany $subscription)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'trial', 'suspended', 'expired', 'cancelled'])],
            'end_date' => ['required', 'date', 'after_or_equal:'.$subscription->start_date->format('Y-m-d')],
            'subscription_plan_id' => ['nullable', 'exists:subscription_plans,id'],
        ]);

        if ($subscription->module?->code === 'SB360-WSIS') {
            $validated['subscription_plan_id'] = $validated['subscription_plan_id'] ?? null;
        } else {
            unset($validated['subscription_plan_id']);
        }
        $subscription->update($validated);

        return redirect()->route('system.admin.subscriptions.show', $subscription)->with('success', 'Subscription updated.');
    }

    public function storePackage(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:modules,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', Rule::in(['Y', 'N'])],
        ]);

        Module::create($validated);

        return redirect()->route('system.admin.packages.index')->with('success', 'Package created.');
    }

    public function updatePackage(Request $request, Module $module)
    {
        $validated = $request->validate([
            'code' => ['required', Rule::in([$module->code])],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', Rule::in(['Y', 'N'])],
        ]);

        $module->update($validated);

        return redirect()->route('system.admin.packages.index')->with('success', 'Package updated.');
    }
}
