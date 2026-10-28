<?php

namespace App\Services;

use App\Models\CompanyStaff;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubscriptionsCompany;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CompanySeatLimits
{
    private const ROLES = [
        3 => ['name' => 'Manager', 'limit' => 'manager_limit'],
        4 => ['name' => 'Supervisor', 'limit' => 'supervisor_limit'],
        7 => ['name' => 'Inspector', 'limit' => 'inspector_limit'],
    ];

    public static function snapshot(int $companyId): array
    {
        $subscription = SubscriptionsCompany::with('plan')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->first();

        $plan = $subscription?->plan;
        if ($subscription && ! $plan) {
            $plan = SubscriptionPlanRequest::with('plan')
                ->where('subscription_id', $subscription->id)
                ->where('status', 'approved')
                ->latest('id')
                ->first()?->plan;
        }

        $extraInspectors = self::extraInspectors($companyId);

        $roles = [];
        foreach (self::ROLES as $roleId => $role) {
            $included = $plan ? (int) $plan->{$role['limit']} : null;
            $extra = $roleId === 7 ? $extraInspectors : 0;
            $roles[$roleId] = [
                'name' => $role['name'],
                'used' => self::used($companyId, $roleId),
                'included' => $included,
                'extra' => $extra,
                'limit' => $included === null ? null : $included + $extra,
            ];
        }

        return [
            'configured' => $plan !== null,
            'plan_name' => $plan?->name,
            'subscription_id' => $subscription?->id,
            'roles' => $roles,
        ];
    }

    public static function assertAvailable(int $companyId, int $roleId, ?int $exceptStaffId = null, ?int $exceptUserId = null): void
    {
        if (! isset(self::ROLES[$roleId])) {
            return;
        }

        $snapshot = self::snapshot($companyId);
        if (! $snapshot['configured']) {
            throw ValidationException::withMessages([
                'role_id' => 'No active package with employee limits is assigned to this company. Ask the system admin to select a package.',
            ]);
        }

        $limit = $snapshot['roles'][$roleId]['limit'];
        $used = self::used($companyId, $roleId, $exceptStaffId, $exceptUserId);
        if ($used >= $limit) {
            $name = self::ROLES[$roleId]['name'];
            throw ValidationException::withMessages([
                'role_id' => "The {$snapshot['plan_name']} package allows {$limit} {$name} account(s). This limit has been reached."
                    . ($roleId === 7 ? ' The company admin can buy extra Inspectors (RM ' . SubscriptionAddon::INSPECTOR_PRICE . ' each) on the Packages page.' : ''),
            ]);
        }
    }

    /** Inspector seats the company bought beyond what its package includes (one-time, kept across renewals). */
    public static function extraInspectors(int $companyId): int
    {
        return (int) SubscriptionAddon::where('company_id', $companyId)->where('type', 'inspector')->sum('quantity');
    }

    private static function used(int $companyId, int $roleId, ?int $exceptStaffId = null, ?int $exceptUserId = null): int
    {
        $staff = CompanyStaff::where('company_id', $companyId)
            ->where('role_id', $roleId)
            ->when($exceptStaffId, fn ($query) => $query->where('id', '!=', $exceptStaffId))
            ->get(['id', 'user_id']);

        $linkedUserIds = $staff->pluck('user_id')->filter()->all();
        $otherUsers = User::where('company_id', $companyId)
            ->where('role_id', $roleId)
            ->when($linkedUserIds, fn ($query) => $query->whereNotIn('id', $linkedUserIds))
            ->when($exceptUserId, fn ($query) => $query->where('id', '!=', $exceptUserId))
            ->count();

        return $staff->count() + $otherUsers;
    }
}
