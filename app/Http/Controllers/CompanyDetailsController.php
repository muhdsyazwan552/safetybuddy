<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyStaff;
use App\Models\Inspection;
use App\Models\Project;
use App\Models\SubconCompany;
use App\Models\SubscriptionsCompany;
use App\Models\ToolboxTalks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyDetailsController extends Controller
{
    /**
     * Company profile page for the logged-in company account.
     */
    public function show(): Response|RedirectResponse
    {
        $user = Auth::user();
        $company = $user->company_id ? Company::find($user->company_id) : null;

        if (!$company) {
            return redirect('/dashboard')->with('error', 'No company is linked to your account.');
        }

        $projectIds = Project::where('company_id', $company->id)->pluck('id');

        $stats = [
            'projects' => $projectIds->count(),
            'active_projects' => Project::where('company_id', $company->id)
                ->whereIn('status', ['active', 'in_progress'])
                ->count(),
            'staff' => CompanyStaff::where('company_id', $company->id)->count(),
            'subcons' => SubconCompany::where('company_id', $company->id)->count(),
            'inspections' => Inspection::whereIn('project_id', $projectIds)->count(),
            'toolbox_talks' => ToolboxTalks::whereIn('project_id', $projectIds)->count(),
        ];

        $subscriptions = SubscriptionsCompany::with('module')
            ->where('company_id', $company->id)
            ->orderByDesc('end_date')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'module' => $s->module->name ?? 'Module',
                'code' => $s->module->code ?? null,
                'status' => $s->status,
                'type' => $s->type,
                'start_date' => optional($s->start_date)->format('Y-m-d'),
                'end_date' => optional($s->end_date)->format('Y-m-d'),
                'is_active' => $s->status === 'active'
                    && $s->end_date
                    && $s->end_date->toDateString() >= now()->toDateString(),
            ])->values();

        return Inertia::render('Company/Details', [
            'title' => 'Company Details',
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'registration_no' => $company->registration_no,
                'email' => $company->email,
                'contact' => $company->contact,
                'address' => $company->address,
                'status' => $company->status,
                'created_at' => optional($company->created_at)->format('d M Y'),
            ],
            'stats' => $stats,
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Update the company's own details.
     */
    public function update(Request $request): RedirectResponse
    {
        $company = Company::findOrFail(Auth::user()->company_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
        ]);

        $company->update($validated);

        return redirect()->route('company.details')->with('success', 'Company details updated');
    }
}
