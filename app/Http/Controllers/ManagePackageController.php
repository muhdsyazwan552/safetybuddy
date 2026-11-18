<?php

namespace App\Http\Controllers;

use App\Models\Payments;
use App\Models\PackageActivationCode;
use App\Models\SubscriptionPlanRequest;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionsCompany;
use App\Services\CompanySeatLimits;
use Barryvdh\DomPDF\Facade\Pdf;
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

        $history = SubscriptionAddon::with('payment:id,payment_status,updated_at')
            ->where('company_id', $companyId)->latest('id')->limit(100)->get()
            ->map(fn (SubscriptionAddon $addon) => [
                'id' => $addon->id,
                'order_no' => $addon->order_no,
                'date' => $addon->created_at?->format('Y-m-d H:i'),
                'type' => $addon->type === 'executor' ? 'Contractor' : 'Inspector',
                'quantity' => $addon->quantity,
                'unit_price' => (float) $addon->unit_price,
                'amount' => (float) $addon->total_amount,
                'status' => $addon->payment?->payment_status ?? 'pending',
                'payment_id' => $addon->payment_id,
            ])->values();

        return Inertia::render('Company/ManagePackage', [
            'history' => $history,
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

        $search = trim((string) $request->query('search', ''));
        $statusFilter = in_array($request->query('status'), ['completed', 'pending', 'failed'], true) ? $request->query('status') : null;
        $payments = Payments::with(['subscription.plan:id,name', 'subscription.module:id,name'])
            ->where('company_id', $companyId)
            ->when($statusFilter, fn ($query) => $query->where('payment_status', $statusFilter))
            ->when($search !== '', function ($query) use ($search, $companyId) {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
                $query->where(function ($inner) use ($like, $search, $companyId) {
                    $inner->where('order_no', 'like', $like)
                        ->orWhereIn('id', SubscriptionAddon::where('company_id', $companyId)->where('order_no', 'like', $like)->pluck('payment_id'))
                        ->orWhereIn('subscription_id', SubscriptionPlanRequest::where('company_id', $companyId)->where('order_no', 'like', $like)->whereNotNull('subscription_id')->pluck('subscription_id'))
                        ->orWhereHas('subscription.plan', fn ($plan) => $plan->where('name', 'like', $like))
                        ->orWhere('payment_type', 'like', $like)
                        ->orWhere('id', ctype_digit(ltrim($search, '#')) ? (int) ltrim($search, '#') : 0);
                });
            })
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(20)->withQueryString();
        $addons = SubscriptionAddon::where('company_id', $companyId)
            ->whereIn('payment_id', $payments->getCollection()->pluck('id'))
            ->get(['payment_id', 'type', 'quantity', 'order_no'])->keyBy('payment_id');
        $planOrders = SubscriptionPlanRequest::where('company_id', $companyId)
            ->whereIn('subscription_id', $payments->getCollection()->pluck('subscription_id')->filter())
            ->pluck('order_no', 'subscription_id');

        $payments->through(function (Payments $payment) use ($addons, $planOrders) {
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
                'order_no' => $addon?->order_no ?? ($planOrders[$payment->subscription_id] ?? null),
                'detail' => $addon ? $addon->quantity.' '.($addon->type === 'executor' ? 'Contractor' : 'Inspector').' '.($addon->quantity === 1 ? 'slot' : 'slots') : null,
                'receipt_no' => $payment->payment_status === 'completed' ? self::receiptNo($payment) : null,
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
                'order_no' => $order->order_no,
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
                'order_no' => $batch,
                'detail' => $codes->count().' '.($codes->count() === 1 ? 'package' : 'packages'),
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
            'filters' => ['search' => $search, 'status' => $statusFilter],
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

    public static function receiptNo(Payments $payment): string
    {
        return \App\Support\ReceiptBuilder::receiptNo($payment);
    }

    /** Receipt (PDF) for an approved payment of the signed-in user's company. */
    public function receipt(Request $request, Payments $payment)
    {
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId && (int) $payment->company_id === $companyId, 403);
        abort_unless($payment->payment_status === 'completed' && $payment->cash_flow !== 'cash_out', 404, 'A receipt is only available for approved payments.');

        return \App\Support\ReceiptBuilder::pdf($payment)->stream(self::receiptNo($payment).'.pdf');
    }

    /** System admin: payment for an extra-slot order was received. */
    public function approveSlot(SubscriptionAddon $addon)
    {
        $payment = Payments::findOrFail($addon->payment_id);
        if ($payment->payment_status !== 'pending') {
            throw ValidationException::withMessages(['order' => 'This slot order has already been reviewed.']);
        }
        $payment->update(['payment_status' => 'completed']);

        $user = \App\Models\User::find($addon->purchased_by);
        $receiptNo = \App\Support\ReceiptBuilder::receiptNo($payment);
        $label = ($addon->type === 'executor' ? 'Contractor' : 'Inspector').' '.($addon->quantity === 1 ? 'slot' : 'slots');
        \App\Mail\OrderStatusMail::deliver($user?->email, new \App\Mail\OrderStatusMail(
            "Payment received — receipt {$receiptNo} ({$addon->order_no})",
            $user?->name ?? 'there',
            'Payment approved',
            "We have received and approved your payment for your extra {$label}. Thank you!",
            'success',
            ['Order number' => $addon->order_no, 'Item' => "Extra {$label} × {$addon->quantity}", 'Amount' => 'RM '.number_format((float) $addon->total_amount, 2), 'Receipt' => $receiptNo],
            $receiptNo,
            \App\Support\ReceiptBuilder::pdf($payment->fresh(), $addon->order_no)->output(),
            url('/manage-package'),
            'Open Manage Slot',
        ));

        return back()->with('success', "Slot order {$addon->order_no} approved. A receipt was emailed to the customer.");
    }

    /** System admin: payment was not received; the slots stop counting for the company. */
    public function rejectSlot(SubscriptionAddon $addon)
    {
        $payment = Payments::findOrFail($addon->payment_id);
        if ($payment->payment_status !== 'pending') {
            throw ValidationException::withMessages(['order' => 'This slot order has already been reviewed.']);
        }
        $payment->update(['payment_status' => 'failed']);

        $user = \App\Models\User::find($addon->purchased_by);
        $label = ($addon->type === 'executor' ? 'Contractor' : 'Inspector').' '.($addon->quantity === 1 ? 'slot' : 'slots');
        \App\Mail\OrderStatusMail::deliver($user?->email, new \App\Mail\OrderStatusMail(
            "Your slot order {$addon->order_no} was not approved",
            $user?->name ?? 'there',
            'Order not approved',
            "We did not receive payment for your extra {$label}, so the order was not approved and the slots were removed. If you already paid, WhatsApp us at 016-8865619 with your order number and receipt.",
            'danger',
            ['Order number' => $addon->order_no, 'Item' => "Extra {$label} × {$addon->quantity}", 'Amount' => 'RM '.number_format((float) $addon->total_amount, 2)],
            null, null, url('/manage-package'), 'Open Manage Slot',
        ));

        return back()->with('success', "Slot order {$addon->order_no} rejected.");
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

        $orderNo = \App\Support\OrderNumber::next($validated['type'] === 'executor' ? \App\Support\OrderNumber::CONTRACTOR_SLOT : \App\Support\OrderNumber::INSPECTOR_SLOT);
        DB::transaction(function () use ($request, $companyId, $subscription, $validated, $type, $quantity, $total, $orderNo) {
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
                'order_no' => $orderNo,
            ]);
        });

        return back()->with('success', "Order {$orderNo}: {$quantity} extra {$type['label']} seat(s) added (RM ".number_format($total).'). WhatsApp us at 016-8865619 with this order number to pay and upload your receipt.');
    }
}
