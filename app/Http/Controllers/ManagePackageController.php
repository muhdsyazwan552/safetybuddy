<?php

namespace App\Http\Controllers;

use App\Models\Payments;
use App\Models\PackageActivationCode;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionsCompany;
use App\Services\CompanySeatLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/** Company admin: see the current package and buy extra Inspector / Executor seats on top of it. */
class ManagePackageController extends Controller
{
    private const TYPES = [
        'inspector' => ['label' => 'Inspector', 'price' => SubscriptionAddon::INSPECTOR_PRICE],
        'executor' => ['label' => 'Contractor', 'price' => SubscriptionAddon::EXECUTOR_PRICE],
    ];

    private function activeSubscription(int $companyId): ?SubscriptionsCompany
    {
        return SubscriptionsCompany::with('plan', 'module')
            ->where('company_id', $companyId)->where('status', 'active')
            ->whereDate('start_date', '<=', today())->whereDate('end_date', '>=', today())
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
            ->latest('start_date')->latest('id')->first();
    }

    public function index(Request $request)
    {
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $subscription = $this->activeSubscription($companyId);
        $snapshot = CompanySeatLimits::snapshot($companyId);

        $seats = fn (string $type, ?int $included, int $extra, int $used) => [
            'type' => $type,
            'label' => self::TYPES[$type]['label'],
            'price' => self::TYPES[$type]['price'],
            'included' => $included,
            'extra' => $extra,
            'used' => $used,
        ];

        return Inertia::render('Company/ManagePackage', [
            'active' => (bool) $subscription,
            'seats' => $subscription ? [
                $seats('inspector', $snapshot['roles'][7]['included'], CompanySeatLimits::extraInspectors($companyId), $snapshot['roles'][7]['used']),
                $seats('executor', $snapshot['executors']['included'], $snapshot['executors']['extra'], $snapshot['executors']['used']),
            ] : [],
        ]);
    }

    public function payments(Request $request)
    {
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $payments = Payments::with(['subscription.plan:id,name', 'subscription.module:id,name'])
            ->where('company_id', $companyId)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(20);
        $addons = SubscriptionAddon::where('company_id', $companyId)
            ->whereIn('payment_id', $payments->getCollection()->pluck('id'))
            ->get(['payment_id', 'type', 'quantity'])->keyBy('payment_id');

        $payments->through(function (Payments $payment) use ($addons) {
            $addon = $addons->get($payment->id);
            $title = match ($payment->payment_type) {
                'addon_inspector' => 'Inspector slots',
                'addon_executor' => 'Contractor slots',
                'activation_code_order' => 'Training package order',
                default => $payment->subscription?->plan?->name
                    ?? $payment->subscription?->module?->name
                    ?? 'Package payment',
            };

            return [
                'id' => $payment->id,
                'date' => $payment->created_at?->format('Y-m-d H:i'),
                'title' => $title,
                'payment_type' => $payment->payment_type,
                'detail' => $addon ? $addon->quantity.' '.($addon->type === 'executor' ? 'Contractor' : 'Inspector').' '.($addon->quantity === 1 ? 'slot' : 'slots') : null,
                'amount' => (float) $payment->total_amount,
                'status' => $payment->payment_status,
                'cash_flow' => $payment->cash_flow,
                'period_start' => $payment->subscription?->start_date?->format('Y-m-d'),
                'period_end' => $payment->subscription?->end_date?->format('Y-m-d'),
            ];
        });

        $planRequests = SubscriptionPlanRequest::with('plan:id,name')
            ->where('company_id', $companyId)->whereIn('status', ['pending', 'rejected'])
            ->latest('id')->get()
            ->map(fn (SubscriptionPlanRequest $order) => [
                'key' => 'plan-'.$order->id,
                'date' => $order->created_at?->format('Y-m-d H:i'),
                'title' => ($order->plan?->name ?? 'Safety Buddy').' package request',
                'detail' => null,
                'amount' => (float) $order->price_yearly,
                'status' => $order->status,
            ]);
        $providerOrders = PackageActivationCode::where('provider_company_id', $companyId)
            ->whereIn('status', ['pending', 'rejected'])->orderByDesc('id')->get()
            ->groupBy('batch_ref')
            ->map(fn ($codes, $batch) => [
                'key' => 'provider-'.$batch,
                'date' => $codes->first()->created_at?->format('Y-m-d H:i'),
                'title' => 'Training package order',
                'detail' => $batch.' · '.$codes->count().' '.($codes->count() === 1 ? 'package' : 'packages'),
                'amount' => (float) $codes->sum('price_yearly'),
                'status' => $codes->first()->status,
            ])->values();

        $subscription = $this->activeSubscription($companyId);
        $packageAmount = $subscription ? Payments::where('company_id', $companyId)
            ->where('subscription_id', $subscription->id)
            ->where('payment_status', 'completed')
            ->whereNotIn('payment_type', ['addon_inspector', 'addon_executor'])
            ->latest('id')->value('total_amount') : null;

        return Inertia::render('Company/PaymentHistory', [
            'payments' => $payments,
            // a company registered under a Training Provider does not see package prices: the provider pays for them
            'underProvider' => (bool) $request->user()->company?->training_provider_company_id,
            'orders' => $planRequests->concat($providerOrders)->sortByDesc('date')->values(),
            'yearlyPayment' => $subscription ? [
                'package_name' => $subscription->plan?->name ?? $subscription->module?->name ?? 'Membership',
                'start_date' => $subscription->start_date?->format('Y-m-d'),
                'end_date' => $subscription->end_date?->format('Y-m-d'),
                'next_billing_date' => $subscription->end_date?->copy()->addDay()->format('Y-m-d'),
                'total' => $packageAmount !== null ? (float) $packageAmount : ($subscription->plan?->price_yearly !== null ? (float) $subscription->plan->price_yearly : null),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless((int) $request->user()->role_id === 2, 403, 'Only the company admin can buy extra seats.');
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $validated = $request->validate([
            'type' => ['required', 'in:inspector,executor'],
            'quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);
        $subscription = $this->activeSubscription($companyId);
        if (! $subscription) {
            throw ValidationException::withMessages(['quantity' => 'Choose and activate a package before adding seats.']);
        }

        $type = self::TYPES[$validated['type']];
        $quantity = (int) $validated['quantity'];
        $total = $quantity * $type['price'];

        DB::transaction(function () use ($request, $companyId, $subscription, $validated, $type, $quantity, $total) {
            // billed as pending: the system admin confirms it when the money is received
            $payment = Payments::create([
                'subscriber_type' => 'company',
                'subscriber_id' => $companyId,
                'company_id' => $companyId,
                'subscription_id' => $subscription->id,
                'total_amount' => $total,
                'payment_type' => 'addon_'.$validated['type'],
                'payment_status' => 'pending',
                'cash_flow' => 'cash_in',
            ]);

            SubscriptionAddon::create([
                'company_id' => $companyId,
                'subscription_id' => $subscription->id,
                'type' => $validated['type'],
                'quantity' => $quantity,
                'unit_price' => $type['price'],
                'total_amount' => $total,
                'payment_id' => $payment->id,
                'purchased_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', "{$quantity} extra {$type['label']} seat(s) added (RM ".number_format($total).'). Payment is arranged with Ramzi at 016-8865619.');
    }
}
