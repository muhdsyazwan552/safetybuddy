<?php

namespace App\Http\Controllers;

use App\Models\AccountType;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Public directory of verified Training Providers (companies on an active Training Provider package). */
class PublicTrainingProviderController extends Controller
{
    public const STATES = [
        'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
        'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
    ];

    public function index(Request $request)
    {
        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'state' => in_array($request->query('state'), self::STATES, true) ? $request->query('state') : '',
            'sort' => in_array($request->query('sort'), ['newest', 'nearest'], true) ? $request->query('sort') : 'name',
            'lat' => is_numeric($request->query('lat')) ? (float) $request->query('lat') : null,
            'lng' => is_numeric($request->query('lng')) ? (float) $request->query('lng') : null,
        ];
        $near = $filters['lat'] !== null && $filters['lng'] !== null && abs($filters['lat']) <= 90 && abs($filters['lng']) <= 180;
        if (! $near) {
            $filters['lat'] = $filters['lng'] = null;
            if ($filters['sort'] === 'nearest') {
                $filters['sort'] = 'name';
            }
        }

        $query = Company::query()
            ->where('account_type_id', AccountType::TRAINING_PROVIDER)
            ->whereHas('subscriptions', fn ($q) => $q
                ->where('status', 'active')
                ->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())
                ->whereHas('plan', fn ($plan) => $plan->where('audience', 'training_provider')))
            ->when($filters['q'] !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', '%'.$filters['q'].'%')
                ->orWhere('address', 'like', '%'.$filters['q'].'%')))
            ->when($filters['state'] !== '', fn ($q) => $q->where('state', $filters['state']))
            ->select('company.*')
            ->when($near, fn ($q) => $q->selectRaw('CASE WHEN latitude IS NULL OR longitude IS NULL THEN NULL ELSE 6371 * ACOS(LEAST(1, COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) END AS distance_km', [$filters['lat'], $filters['lng'], $filters['lat']]));

        $query = match ($filters['sort']) {
            'newest' => $query->latest('id'),
            'nearest' => $query->orderByRaw('distance_km IS NULL')->orderBy('distance_km')->orderBy('name'),
            default => $query->orderBy('name'),
        };

        $providers = $query->paginate(6)->withQueryString()->through(function (Company $company) {
            $application = \App\Models\TrainingProviderApplication::with('certificates:id,application_id,issuing_body')
                ->where('company_id', $company->id)->where('status', 'approved')->latest('id')->first();

            return [
                'id' => $company->id,
                'name' => $company->name,
                'logo_url' => $company->logo_url,
                'address' => $this->clean(implode(', ', array_filter([$company->address, $company->postcode.' '.$company->city, $company->state], fn ($part) => trim((string) $part) !== '' && trim((string) $part) !== '-'))),
                'distance_km' => isset($company->distance_km) ? round((float) $company->distance_km, 1) : null,
                'email' => $this->clean($company->email),
                'contact' => $this->clean($company->contact),
                'registration_no' => $application?->registration_no ?? $company->registration_no,
                'certified_by' => $application ? $application->certificates->pluck('issuing_body')->filter()->unique()->values() : [],
            ];
        });

        return Inertia::render('PublicWeb/TrainingProviders', [
            'providers' => $providers,
            'filters' => $filters,
            'states' => self::STATES,
        ]);
    }

    /** JSON list for the in-page "check registered Training Providers" window, so signed-in users do not leave the Plans page. */
    public function list(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $providers = Company::query()
            ->where('account_type_id', AccountType::TRAINING_PROVIDER)
            ->whereHas('subscriptions', fn ($query) => $query
                ->where('status', 'active')
                ->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())
                ->whereHas('plan', fn ($plan) => $plan->where('audience', 'training_provider')))
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('name', 'like', '%'.$q.'%')
                ->orWhere('state', 'like', '%'.$q.'%')
                ->orWhere('city', 'like', '%'.$q.'%')))
            ->orderBy('name')->limit(30)->get()
            ->map(fn (Company $company) => [
                'id' => $company->id,
                'name' => $company->name,
                'logo_url' => $company->logo_url,
                'location' => $this->clean(implode(', ', array_filter([$company->city, $company->state], fn ($part) => trim((string) $part) !== '' && trim((string) $part) !== '-'))),
                'email' => $this->clean($company->email),
                'contact' => $this->clean($company->contact),
            ])->values();

        return response()->json(['providers' => $providers]);
    }

    private function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return in_array($value, ['', '-'], true) ? null : $value;
    }
}
