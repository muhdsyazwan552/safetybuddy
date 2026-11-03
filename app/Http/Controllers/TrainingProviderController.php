<?php

namespace App\Http\Controllers;

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
        abort_unless((int) $request->user()->role_id === 2, 403, 'Only the company admin can apply.');
        $companyId = (int) $request->user()->company_id;
        abort_unless($companyId, 403, 'No company is linked to your account.');

        $validated = $request->validate([
            'registration_no' => ['required', 'string', 'max:100'],
            'registration_document' => ['required', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048'],
            'certificates' => ['required', 'array', 'min:1', 'max:20'],
            'certificates.*.issuing_body' => ['required', 'string', 'max:150'],
            'certificates.*.expiry_date' => ['required', 'date', 'after:today'],
            'certificates.*.file' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg', 'max:5120'],
            'terms' => ['accepted'],
        ], [
            'registration_no.required' => 'Please enter your registration number.',
            'registration_document.required' => 'Please upload your registration document.',
            'registration_document.max' => 'The registration document must not be larger than 2 MB.',
            'certificates.required' => 'Add at least one training certificate.',
            'certificates.min' => 'Add at least one training certificate.',
            'certificates.*.expiry_date.after' => 'A certificate must not be expired.',
            'terms.accepted' => 'You must agree to the terms and conditions.',
        ]);

        if (TrainingProviderApplication::where('company_id', $companyId)->whereIn('status', ['pending', 'approved'])->exists()) {
            throw ValidationException::withMessages(['registration_no' => 'Your company already has a Training Provider application in progress.']);
        }

        $plan = SubscriptionPlan::where('audience', 'training_provider')->where('is_active', true)->orderBy('sort_order')->firstOrFail();

        DB::transaction(function () use ($request, $validated, $companyId, $plan) {
            $application = TrainingProviderApplication::create([
                'company_id' => $companyId,
                'plan_id' => $plan->id,
                'registration_no' => $validated['registration_no'],
                'registration_document' => $request->file('registration_document')->store("training-providers/{$companyId}"),
                'status' => 'pending',
                'requested_by' => $request->user()->id,
            ]);

            foreach ($validated['certificates'] as $index => $certificate) {
                $file = $request->file("certificates.$index.file");
                $application->certificates()->create([
                    'issuing_body' => $certificate['issuing_body'],
                    'expiry_date' => $certificate['expiry_date'],
                    'file_path' => $file->store("training-providers/{$companyId}"),
                    'file_name' => $file->getClientOriginalName(),
                ]);
            }
        });

        return redirect()->route('subscription.plans')->with('success', 'Application submitted. Verification takes 3 – 4 working days and you will be notified once it is reviewed.');
    }

    /** Companies that registered under this Training Provider's reference code (even before payment is confirmed). */
    public function trainees(Request $request)
    {
        $company = $request->user()->company;
        abort_unless($company && (int) $company->account_type_id === \App\Models\AccountType::TRAINING_PROVIDER, 403, 'Only Training Providers can open this page.');

        // every company that entered this provider's reference code, whether or not it has a package yet
        $trainees = \App\Models\Company::where('training_provider_company_id', $company->id)
            ->orderByDesc('provider_linked_at')->get(['id', 'name', 'code', 'email', 'contact', 'provider_linked_at', 'training_provider_company_id'])
            ->map(function (\App\Models\Company $trainee) use ($company) {
                $subscription = \App\Models\SubscriptionsCompany::with('plan:id,name')
                    ->where('company_id', $trainee->id)
                    ->whereHas('module', fn ($query) => $query->where('code', 'SB360-WSIS'))
                    ->latest('end_date')->first();
                $pending = SubscriptionPlanRequest::where('company_id', $trainee->id)->where('status', 'pending')->exists();
                $usedCodes = \App\Models\PackageActivationCode::with('plan:id,name')
                    ->where('used_by_company_id', $trainee->id)->where('provider_company_id', $trainee->training_provider_company_id)
                    ->latest('used_at')->get()
                    ->map(fn ($code) => ['code' => $code->code, 'package' => $code->plan?->name, 'used_at' => $code->used_at?->format('Y-m-d')])->values();
                $active = $subscription && $subscription->status === 'active' && $subscription->end_date >= today();

                return [
                    'id' => $trainee->id,
                    'company_name' => $trainee->name,
                    'company_code' => $trainee->code,
                    'email' => $trainee->email,
                    'contact' => $trainee->contact,
                    'package' => $subscription?->plan?->name,
                    'reference_code' => $company->reference_code,
                    'activation_codes' => $usedCodes,
                    'registered_at' => $trainee->provider_linked_at?->format('Y-m-d'),
                    'end_date' => $subscription?->end_date?->format('Y-m-d'),
                    'active' => (bool) $active,
                    'state' => $active ? 'active' : ($pending ? 'pending' : ($subscription ? 'expired' : 'no_package')),
                ];
            })->values();

        return \Inertia\Inertia::render('Company/Trainees', [
            'referenceCode' => $company->reference_code,
            'trainees' => $trainees,
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

        return \Inertia\Inertia::render('Admin/TrainingProviders', [
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

        return \Inertia\Inertia::render('Admin/TrainingProviderOrders', [
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

        return \Inertia\Inertia::render('Admin/TrainingProviderOrderDetails', [
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
        return \Inertia\Inertia::render('Admin/TrainingProviderApprovals', [
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

        return \Inertia\Inertia::render('Admin/TrainingProviderApprovalDetails', [
            'title' => 'Review Training Provider',
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'registration_no' => $application->registration_no,
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
                    'company_id' => $application->company_id,
                    'plan_id' => $plan->id,
                    'price_yearly' => $plan->price_yearly,
                    'status' => 'pending',
                    'requested_by' => $application->requested_by,
                ]);
            }
        });

        return back()->with('success', 'Training Provider verified. A payment request has been opened for the company.');
    }

    public function reject(Request $request, TrainingProviderApplication $application)
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        if ($application->status !== 'pending') {
            throw ValidationException::withMessages(['application' => 'This application has already been reviewed.']);
        }
        $application->update(['status' => 'rejected', 'reviewed_at' => now(), 'rejection_reason' => $validated['reason']]);

        return back()->with('success', 'Training Provider application rejected.');
    }

    public function registrationDocument(TrainingProviderApplication $application)
    {
        abort_unless(Storage::exists($application->registration_document), 404);

        return Storage::download($application->registration_document);
    }

    public function certificateFile(TrainingProviderCertificate $certificate)
    {
        abort_unless(Storage::exists($certificate->file_path), 404);

        return Storage::download($certificate->file_path, $certificate->file_name);
    }
}
