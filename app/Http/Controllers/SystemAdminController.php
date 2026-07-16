<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Manhour;
use App\Models\Module;
use App\Models\Payments;
use App\Models\Project;
use App\Models\Role;
use App\Models\SubscriptionsCompany;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SystemAdminController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Admin/System_Dashboard', [
            'title' => 'System Administration',
            'stats' => [
                'users' => User::count(),
                'companies' => Company::count(),
                'projects' => Project::count(),
                'manhours' => Manhour::count(),
            ],
            'users' => User::with(['role:id,display_name,name', 'company:id,name'])
                ->latest('created_at')
                ->get(['id', 'name', 'email', 'phone', 'company_id', 'role_id', 'created_at']),
            'roles' => Role::orderBy('id')->get(['id', 'name', 'display_name']),
            'companies' => Company::orderBy('name')->get(['id', 'name']),
        ]);
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
        User::create($validated);

        return redirect()->route('system.admin.dashboard')->with('success', 'User account created.');
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

        if ($request->user()->is($user) && (int) $validated['role_id'] !== 1) {
            return back()->withErrors(['role_id' => 'You cannot remove your own System Admin role.']);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('system.admin.dashboard')->with('success', 'User account updated.');
    }

    public function subscriptions()
    {
        SubscriptionsCompany::where('status', 'active')
            ->whereDate('end_date', '<', today())
            ->update(['status' => 'expired']);

        $subscriptions = SubscriptionsCompany::with(['company:id,name', 'module:id,code,name,price'])
            ->latest('created_at')
            ->get()
            ->map(fn (SubscriptionsCompany $subscription) => [
                'id' => $subscription->id,
                'company_id' => $subscription->company_id,
                'company_name' => $subscription->company?->name ?? 'Unknown company',
                'module_id' => $subscription->module_id,
                'module_name' => $subscription->module?->name ?? 'Legacy package',
                'module_code' => $subscription->module?->code,
                'price' => (float) ($subscription->module?->price ?? 0),
                'start_date' => $subscription->start_date?->format('Y-m-d'),
                'end_date' => $subscription->end_date?->format('Y-m-d'),
                'status' => $subscription->status,
                'type' => $subscription->type,
                'created_at' => $subscription->created_at?->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('Admin/Subscription_Management', [
            'title' => 'Subscription Management',
            'stats' => [
                'active' => $subscriptions->where('status', 'active')->count(),
                'expiring' => $subscriptions->filter(fn ($subscription) => $subscription['status'] === 'active' && $subscription['end_date'] <= today()->addDays(30)->format('Y-m-d'))->count(),
                'expired' => $subscriptions->where('status', 'expired')->count(),
                'revenue' => $subscriptions->where('status', 'active')->sum('price'),
            ],
            'subscriptions' => $subscriptions,
            'companies' => Company::orderBy('name')->get(['id', 'name']),
            'packages' => Module::orderBy('name')->get(['id', 'code', 'name', 'description', 'price', 'is_active']),
        ]);
    }

    public function storeSubscription(Request $request)
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:company,id'],
            'module_id' => ['required', 'exists:modules,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'trial', 'suspended', 'cancelled'])],
            'type' => ['required', Rule::in(['new', 'renew', 'trial', 'manual'])],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_type' => ['nullable', 'string', 'max:50'],
            'payment_status' => ['nullable', Rule::in(['completed', 'pending', 'failed', 'not_recorded'])],
        ]);

        DB::transaction(function () use ($validated) {
            $subscription = SubscriptionsCompany::create([
                'company_id' => $validated['company_id'],
                'module_id' => $validated['module_id'],
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
        });

        return redirect()->route('system.admin.subscriptions')->with('success', 'Subscription period created.');
    }

    public function updateSubscription(Request $request, SubscriptionsCompany $subscription)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'trial', 'suspended', 'expired', 'cancelled'])],
            'end_date' => ['required', 'date'],
        ]);

        $subscription->update($validated);

        return redirect()->route('system.admin.subscriptions')->with('success', 'Subscription updated.');
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

        return redirect()->route('system.admin.subscriptions')->with('success', 'Package created.');
    }
}
