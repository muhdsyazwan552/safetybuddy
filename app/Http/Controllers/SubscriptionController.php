<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\SubscriptionsCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Illuminate\Validation\Rules;

class SubscriptionController extends Controller
{

    public function index()
    {
        $companyId = Auth::user()->company_id;

        // Get all subscriptions for this company (any status)
        $subscriptions = SubscriptionsCompany::where('company_id', $companyId)
            ->get()
            ->keyBy('module_id'); // keyed by module_id for easy lookup

        $modules = Module::where('is_active', 'Y')
            ->get()
            ->map(function ($module) use ($subscriptions) {
                $isFree       = floatval($module->price) === 0.0;
                $subscription = $subscriptions->get($module->id);

                $isActive = $subscription
                    && $subscription->status === 'active'
                    && $subscription->end_date >= now()->toDateString();

                $module->is_available    = $isFree || $isActive;
                $module->description     = $module->description ?? '';
                $module->sub_status      = $subscription?->status ?? null;       // active | expired | null
                $module->sub_type        = $subscription?->type ?? null;          // new | renew | null
                $module->sub_end_date    = $subscription?->end_date ?? null;      // for display
                $module->has_subscribed_before = $subscription !== null;          // ever subscribed?

                return $module;
            });

        return Inertia::render('Module', [
            'modules' => $modules,
        ]);
    }
}
