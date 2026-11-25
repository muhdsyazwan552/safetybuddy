<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            // every page embeds this in its HTML (data-page), so only send what the UI reads
            'auth' => [
                'user' => fn () => $this->authUser($request->user()),
            ],
            // red notification numbers on the Supervisor / Manager menu (cached briefly: they are computed from several feeds)
            'reviewBadges' => fn () => $this->reviewBadges($request->user()),
            'adminBadges' => fn () => $this->adminBadges($request->user()),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info' => fn() => $request->session()->get('info'),
            ],
        ];
    }

    /** System admin sidebar: how many items wait for approval on each menu. */
    private function adminBadges($user): ?array
    {
        if (! $user || (int) $user->role_id !== UserRole::SystemAdmin->value) {
            return null;
        }

        return [
            '/admin/approvals' => \Illuminate\Support\Facades\DB::table('subscription_plan_requests')->where('status', 'pending')->count(),
            '/admin/slot-orders' => \Illuminate\Support\Facades\DB::table('payments')->whereIn('payment_type', ['addon_inspector', 'addon_executor'])->where('payment_status', 'pending')->count(),
            '/admin/training-providers/approvals' => \Illuminate\Support\Facades\DB::table('training_provider_applications')->where('status', 'pending')->count(),
            '/admin/training-providers/orders' => \Illuminate\Support\Facades\DB::table('package_activation_codes')->where('status', 'pending')->distinct()->count('batch_ref'),
        ];
    }

    private function reviewBadges($user): ?array
    {
        if (! $user || ! in_array((int) $user->role_id, UserRole::reviewerIds(), true) || ! $user->company_id) {
            return null;
        }

        return \Illuminate\Support\Facades\Cache::remember("review-badges:{$user->id}", 20, function () {
            try {
                return app(\App\Http\Controllers\ReviewController::class)->badges();
            } catch (\Throwable $exception) {
                report($exception);

                return [];
            }
        });
    }

    private function authUser($user): ?array
    {
        if (!$user) {
            return null;
        }

        $user->loadMissing('company:id,name,code,reference_code,logo_path,account_type_id,training_provider_company_id', 'company.accountType:id,name', 'company.trainingProvider:id,name', 'role:id,name,display_name');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'company_id' => $user->company_id,
            'role_id' => $user->role_id,
            'role_label' => UserRole::labelFor($user->role_id),
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'code' => $user->company->code,
                'logo_url' => $user->company->logo_url,
                'reference_code' => $user->company->reference_code,
                'account_type_id' => $user->company->account_type_id,
                'account_type' => $user->company->accountType?->name,
                'training_provider_name' => $user->company->trainingProvider?->name,
            ] : null,
            'role' => $user->role ? ['id' => $user->role->id, 'name' => $user->role->name, 'display_name' => $user->role->display_name] : null,
        ];
    }
}
