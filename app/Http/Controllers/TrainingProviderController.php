<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;

use App\Support\UploadedAssets;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanRequest;
use App\Models\TrainingProviderApplication;
use App\Models\TrainingProviderCertificate;
use App\Models\AccountType;
use App\Models\Company;
use App\Models\SubscriptionsCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Training Provider flow: apply + documents -> admin verifies (3-4 working days)
 * -> approval opens a pending purchase request -> payment confirmed -> subscription active.
 */
class TrainingProviderController extends Controller
{
    public function store(Request $request)
    {
        abort_unless((int) $request->user()->role_id === UserRole::CompanyAdmin->value, 403, 'Only the company admin can apply.');
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:150'],
            'registration_no' => ['required', 'string', 'max:100'],
            'owner_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'registration_document' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg', 'max:5120'],
        ], [
            'company_name.required' => 'Please enter your registered company name.',
            'registration_no.required' => 'Please enter your company registration number.',
            'owner_name.required' => 'Please enter the owner\'s full name.',
            'email.required' => 'Please enter your email address.',
            'registration_document.required' => 'Please upload your company registration certificate.',
            'registration_document.max' => 'The registration certificate must not be larger than 5 MB.',
        ]);

        if (TrainingProviderApplication::where('company_id', $companyId)->whereIn('status', ['pending', 'approved'])->exists()) {
            throw ValidationException::withMessages(['registration_no' => 'Your company already has a Training Provider application in progress.']);
        }

        $plan = SubscriptionPlan::where('audience', 'training_provider')->where('is_active', true)->orderBy('sort_order')->firstOrFail();

        DB::transaction(function () use ($request, $validated, $companyId, $plan) {
            $application = TrainingProviderApplication::create([
                'company_id' => $companyId,
                'plan_id' => $plan->id,
                'company_name' => $validated['company_name'],
                'registration_no' => $validated['registration_no'],
                'owner_name' => $validated['owner_name'],
                'email' => $validated['email'],
                'registration_document' => UploadedAssets::store($request->file('registration_document'), "training-providers/{$companyId}"),
                'status' => 'pending',
                'requested_by' => $request->user()->id,
            ]);

        });

        return redirect()->route('subscription.plans')->with('success', 'Application submitted. Verification takes 3 – 4 working days and you will be notified once it is reviewed.');
    }

    /** Companies that registered under this Training Provider's reference code (even before payment is confirmed). */
    private function providerCompany(Request $request): Company
    {
        $company = $request->user()->company;
        abort_unless($company && (int) $company->account_type_id === \App\Models\AccountType::TRAINING_PROVIDER, 403, 'Only Training Providers can open this page.');

        return $company;
    }

    /** One company under the provider: who it is and where its package stands. */
    private function traineeSummary(Company $provider, Company $trainee): array
    {
        $subscription = \App\Models\SubscriptionsCompany::with('plan:id,name')
            ->where('company_id', $trainee->id)
            ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
            ->latest('end_date')->first();
        $pending = SubscriptionPlanRequest::where('company_id', $trainee->id)->where('status', 'pending')->exists();
        $active = $subscription && $subscription->status === 'active' && $subscription->end_date >= today();

        return [
            'id' => $trainee->id,
            'company_name' => $trainee->name,
            'company_code' => $trainee->code,
            'email' => $trainee->email,
            'contact' => $trainee->contact,
            'package' => $subscription?->plan?->name,
            'registered_at' => $trainee->provider_linked_at?->format('Y-m-d'),
            'start_date' => $subscription?->start_date?->format('Y-m-d'),
            'end_date' => $subscription?->end_date?->format('Y-m-d'),
            'days_left' => $subscription ? (int) today()->diffInDays($subscription->end_date, false) : null,
            'active' => (bool) $active,
            'state' => $active ? 'active' : ($pending ? 'pending' : ($subscription ? 'expired' : 'no_package')),
        ];
    }

    public function trainees(Request $request)
    {
        $company = $this->providerCompany($request);

        // every company that entered this provider's reference code, whether or not it has a package yet
        $trainees = Company::where('training_provider_company_id', $company->id)
            ->orderByDesc('provider_linked_at')->get(['id', 'name', 'code', 'email', 'contact', 'provider_linked_at', 'training_provider_company_id'])
            ->map(fn (Company $trainee) => $this->traineeSummary($company, $trainee))->values();

        return \Inertia\Inertia::render('Admin/Company/Account/Trainees', [
            'referenceCode' => $company->reference_code,
            'trainees' => $trainees,
        ]);
    }

    /** Detail page of one company under this provider: its package, package history and the activation codes it used. */
    public function showTrainee(Request $request, int $trainee)
    {
        $provider = $this->providerCompany($request);
        $company = Company::where('training_provider_company_id', $provider->id)->findOrFail($trainee);

        return \Inertia\Inertia::render('Admin/Company/Account/TraineeDetails', [
            'trainee' => $this->traineeSummary($provider, $company),
            'subscriptions' => \App\Models\SubscriptionsCompany::with('plan:id,name')
                ->where('company_id', $company->id)
                ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
                ->orderByDesc('end_date')->get()
                ->map(fn ($subscription) => [
                    'id' => $subscription->id,
                    'package' => $subscription->plan?->name,
                    'type' => $subscription->type,
                    'start_date' => $subscription->start_date?->format('Y-m-d'),
                    'end_date' => $subscription->end_date?->format('Y-m-d'),
                    'status' => $subscription->status === 'active' && $subscription->end_date < today() ? 'expired' : $subscription->status,
                ])->values(),
            'codes' => \App\Models\PackageActivationCode::with('plan:id,name')
                ->where('used_by_company_id', $company->id)->where('provider_company_id', $provider->id)
                ->latest('used_at')->get()
                ->map(fn ($code) => [
                    'id' => $code->id,
                    'code' => $code->code,
                    'package' => $code->plan?->name,
                    'price' => $code->price_yearly,
                    'batch_ref' => $code->batch_ref,
                    'used_at' => $code->used_at?->format('Y-m-d'),
                ])->values(),
        ]);
    }

    /** System admin review page. */
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $search = trim($filters['search'] ?? '');
        $providers = Company::query()->where('account_type_id', AccountType::TRAINING_PROVIDER)
            ->withCount('trainees')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('reference_code', 'like', "%{$search}%");
            }))
            ->orderBy('name')->paginate(20)->withQueryString();

        $providerIds = $providers->getCollection()->pluck('id');
        $subscriptions = SubscriptionsCompany::whereIn('company_id', $providerIds)
            ->with('plan:id,name')->orderByDesc('end_date')->orderByDesc('id')->get()->groupBy('company_id');
        $subscriptionSummary = function (Company $company) use ($subscriptions) {
            $records = $subscriptions->get($company->id, collect());
            $current = $records->first(fn ($record) => $record->status === 'active'
                && $record->start_date?->lte(today()) && $record->end_date?->gte(today())) ?? $records->first();

            return $current ? [
                'plan' => $current->plan?->name,
                'status' => $current->status === 'active' && $current->end_date?->lt(today()) ? 'expired' : $current->status,
                'end_date' => $current->end_date?->format('Y-m-d'),
            ] : null;
        };
        $providers->setCollection($providers->getCollection()->map(function (Company $provider) use ($subscriptionSummary) {
            return [
                'id' => $provider->id,
                'name' => $provider->name,
                'code' => $provider->code,
                'reference_code' => $provider->reference_code,
                'registration_no' => $provider->registration_no,
                'email' => $provider->email,
                'contact' => $provider->contact,
                'state' => $provider->state,
                'status' => $provider->status,
                'logo_url' => $provider->logo_url,
                'subscription' => $subscriptionSummary($provider),
                'trainees_count' => $provider->trainees_count,
            ];
        }));

        return \Inertia\Inertia::render('Admin/System/TrainingProviders', [
            'title' => 'Training Providers',
            'providers' => $providers,
            'filters' => ['search' => $search],
        ]);
    }

    public function linkedCompanies(Company $provider)
    {
        abort_unless((int) $provider->account_type_id === AccountType::TRAINING_PROVIDER, 404);

        return app(SystemAdminController::class)->showCompany($provider);
    }

    public function orders()
    {
        $pendingBatches = \App\Models\PackageActivationCode::where('status', 'pending')->distinct()->pluck('batch_ref');
        $recentBatches = \App\Models\PackageActivationCode::select('batch_ref')->groupBy('batch_ref')
            ->orderByRaw('MAX(id) DESC')->limit(100)->pluck('batch_ref');
        $batchRefs = $pendingBatches->merge($recentBatches)->unique();

        return \Inertia\Inertia::render('Admin/System/TrainingProviderOrders', [
            'title' => 'Training Provider Activation Code Orders',
            'orders' => \App\Models\PackageActivationCode::with(['provider:id,name,code', 'plan:id,name', 'usedBy:id,name,code'])
                ->whereIn('batch_ref', $batchRefs)->latest('id')->get()->groupBy('batch_ref')
                ->map(fn ($codes, $batch) => $this->formatOrder($codes, $batch, false))->values(),
        ]);
    }

    public function showOrder(string $batch)
    {
        $codes = \App\Models\PackageActivationCode::with(['provider:id,name,code,reference_code,email,contact', 'plan:id,name,code,price_yearly', 'usedBy:id,name,code,email,contact'])
            ->where('batch_ref', $batch)->latest('id')->get();
        abort_if($codes->isEmpty(), 404);

        return \Inertia\Inertia::render('Admin/System/TrainingProviderOrderDetails', [
            'title' => 'Activation Code Order '.$batch,
            'order' => $this->formatOrder($codes, $batch, true),
        ]);
    }

    private function formatOrder($codes, string $batch, bool $includeCodes): array
    {
        $first = $codes->first();
        $used = $codes->where('status', 'used')->count();
        $available = $codes->where('status', 'available')->count();

        return [
            'batch_ref' => $batch,
            'provider_id' => $first->provider_company_id,
            'provider' => $first->provider?->name,
            'provider_code' => $first->provider?->code,
            'provider_reference_code' => $first->provider?->reference_code,
            'provider_email' => $first->provider?->email,
            'provider_contact' => $first->provider?->contact,
            'package' => $first->plan?->name,
            'package_code' => $first->plan?->code,
            'quantity' => $codes->count(),
            'total' => $codes->sum('price_yearly'),
            'unit_price' => $first->price_yearly,
            'status' => in_array($first->status, ['pending', 'rejected'], true)
                ? $first->status
                : ($used === $codes->count() ? 'used' : ($used > 0 ? 'partially used' : 'available')),
            'available' => $available,
            'used' => $used,
            'created_at' => $first->created_at?->format('Y-m-d H:i'),
            'paid_at' => $first->paid_at?->format('Y-m-d H:i'),
            'codes' => $includeCodes ? $codes->map(fn ($code) => [
                'id' => $code->id,
                'code' => in_array($code->status, ['available', 'used'], true) ? $code->code : null,
                'status' => $code->status,
                'used_by_company_id' => $code->used_by_company_id,
                'used_by_company' => $code->usedBy?->name,
                'used_by_company_code' => $code->usedBy?->code,
                'used_by_company_email' => $code->usedBy?->email,
                'used_by_company_contact' => $code->usedBy?->contact,
                'used_at' => $code->used_at?->format('Y-m-d H:i'),
            ])->values() : null,
        ];
    }

    public function approvalsIndex()
    {
        return \Inertia\Inertia::render('Admin/System/TrainingProviderApprovals', [
            'title' => 'Training Provider Approvals',
            'applications' => TrainingProviderApplication::with([
                'company:id,name,code,registration_no,state', 'plan:id,name',
            ])->withCount('certificates')
                ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
                ->latest()->get(),
        ]);
    }

    public function approvalDetails(TrainingProviderApplication $application)
    {
        $application->load(['company.accountType', 'plan', 'certificates']);
        $company = $application->company;
        $requester = \App\Models\User::find($application->requested_by, ['id', 'name', 'email', 'phone']);

        return \Inertia\Inertia::render('Admin/System/TrainingProviderApprovalDetails', [
            'title' => 'Review Training Provider',
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'registration_no' => $application->registration_no,
                'company_name' => $application->company_name,
                'owner_name' => $application->owner_name,
                'email' => $application->email,
                'rejection_reason' => $application->rejection_reason,
                'created_at' => $application->created_at?->format('Y-m-d H:i'),
                'reviewed_at' => $application->reviewed_at?->format('Y-m-d H:i'),
                'requester' => $requester?->only(['id', 'name', 'email', 'phone']),
                'company' => $company ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'code' => $company->code,
                    'registration_no' => $company->registration_no,
                    'email' => $company->email,
                    'contact' => $company->contact,
                    'address' => $company->address,
                    'city' => $company->city,
                    'postcode' => $company->postcode,
                    'state' => $company->state,
                    'status' => $company->status,
                    'account_type' => $company->accountType?->name,
                    'logo_url' => $company->logo_url,
                ] : null,
                'plan' => $application->plan?->only([
                    'id', 'name', 'code', 'price_yearly', 'manager_limit', 'supervisor_limit',
                    'inspector_limit', 'contractor_limit', 'daily_pdf_limit', 'monthly_pdf_limit',
                ]),
                'certificates' => $application->certificates->map(fn ($certificate) => [
                    'id' => $certificate->id,
                    'issuing_body' => $certificate->issuing_body,
                    'expiry_date' => $certificate->expiry_date?->format('Y-m-d'),
                    'file_name' => $certificate->file_name,
                ])->values(),
            ],
        ]);
    }

    public function approve(Request $request, TrainingProviderApplication $application)
    {
        $request->validate(['reviewed' => ['accepted']]);
        DB::transaction(function () use ($application) {
            $application = TrainingProviderApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ($application->status !== 'pending') {
                throw ValidationException::withMessages(['application' => 'This application has already been reviewed.']);
            }

            $plan = SubscriptionPlan::findOrFail($application->plan_id);
            $application->update(['status' => 'approved', 'reviewed_at' => now(), 'rejection_reason' => null]);

            // verified -> payment step: the existing purchase request is confirmed once payment is received
            if (! SubscriptionPlanRequest::where('company_id', $application->company_id)->where('status', 'pending')->exists()) {
                SubscriptionPlanRequest::create([
                    'order_no' => \App\Support\OrderNumber::next(\App\Support\OrderNumber::planCode($plan)),
                    'company_id' => $application->company_id,
                    'plan_id' => $plan->id,
                    'price_yearly' => $plan->price_yearly,
                    'status' => 'pending',
                    'requested_by' => $application->requested_by,
                ]);
            }
        });

        $application->refresh();
        $user = \App\Models\User::find($application->requested_by);
        $order = SubscriptionPlanRequest::where('company_id', $application->company_id)->where('status', 'pending')->latest('id')->first();
        \App\Mail\OrderStatusMail::deliver($user?->email, new \App\Mail\OrderStatusMail(
            'You are verified as a Training Provider'.($order?->order_no ? ' — order '.$order->order_no : ''),
            $user?->name ?? 'there',
            'Training Provider approved',
            "Good news: your Training Provider application is approved.\nNext step: make payment. Open Safety Buddy and tap the WhatsApp number on your order card; it opens a chat with your order details filled in. Your dashboard opens once payment is confirmed.",
            'success',
            array_filter(['Company' => $application->company_name, 'Order number' => $order?->order_no, 'Amount' => $order ? 'RM '.number_format((float) $order->price_yearly, 2) : null]),
            null, null, url('/plans'), 'Open my order',
        ));

        return back()->with('success', 'Training Provider verified. An order with its own order number has been placed for the company.');
    }

    public function reject(Request $request, TrainingProviderApplication $application)
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        if ($application->status !== 'pending') {
            throw ValidationException::withMessages(['application' => 'This application has already been reviewed.']);
        }
        $application->update(['status' => 'rejected', 'reviewed_at' => now(), 'rejection_reason' => $validated['reason']]);

        $user = \App\Models\User::find($application->requested_by);
        \App\Mail\OrderStatusMail::deliver($user?->email, new \App\Mail\OrderStatusMail(
            'Your Training Provider application was not approved',
            $user?->name ?? 'there',
            'Application not approved',
            'We could not approve your Training Provider application.'."\nReason: ".$validated['reason']."\nYou can correct your details and submit the application again.",
            'danger',
            array_filter(['Company' => $application->company_name, 'Registration number' => $application->registration_no]),
            null, null, url('/plans'), 'Update my application',
        ));

        return back()->with('success', 'Training Provider application rejected.');
    }

    public function registrationDocument(TrainingProviderApplication $application)
    {
        return $this->downloadAsset($application->registration_document);
    }

    public function certificateFile(TrainingProviderCertificate $certificate)
    {
        return $this->downloadAsset($certificate->file_path, $certificate->file_name);
    }

    private function downloadAsset(string $path, ?string $name = null)
    {
        $disk = UploadedAssets::disk($path, 'local');
        if ($disk->exists($path)) {
            return $disk->download($path, $name);
        }

        $s3 = Storage::disk('s3');
        abort_if($disk === $s3 || !$s3->exists($path), 404);

        return $s3->download($path, $name);
    }
}
