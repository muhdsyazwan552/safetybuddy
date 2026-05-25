<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use App\Models\Project;
use App\Models\Company;
use App\Models\SubconCompany;
use App\Models\IncidentType;
use App\Models\InjuryType;
use App\Models\CompanyStaff;
use App\Models\ProjectAssign;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class IncidentController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────────
    // 1. CREATE  →  GET  /incident/create
    // ─────────────────────────────────────────────────────────────────────────────
    public function create()
    {
        $user = Auth::user();

        $userStaff = CompanyStaff::where('user_id', $user->id)->first();
        $companyId = $userStaff ? $userStaff->company_id : null;

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('WSIS/Incident_Create', [
            'title'           => 'Report Incident',
            'userCompanyId'   => $companyId,
            'projects'        => $projects,
            'companies'       => Company::orderBy('name')->get(['id', 'name']),
            'incidentTypes'   => IncidentType::orderBy('name')->get(['id', 'name']),
            'injuryTypes'     => InjuryType::orderBy('name')->get(['id', 'name']),
            'subconCompanies' => SubconCompany::orderBy('name')->get(['id', 'name']),
            'staffList'       => CompanyStaff::with('role:id,name')
                ->where('company_id', $companyId)
                ->orderBy('name')
                ->get(['id', 'name', 'role_id', 'user_id'])
                ->map(fn($s) => [
                    'id'       => $s->id,
                    'name'     => $s->name,
                    'role_name' => optional($s->role)->name,
                    'user_id'  => $s->user_id,
                ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Get subcon companies and staff assigned to a specific project (AJAX)
    //
    // We query project_assign via DB facade directly to avoid the
    // getEntityTypeAttribute() accessor on ProjectAssign, which maps raw strings
    // ('compsub', 'staff') to class names — breaking match() inside getEntity().
    // ─────────────────────────────────────────────────────────────────────────────
    public function getProjectAssignments($projectId)
    {
        // 1. SubconCompany IDs for this project (entity_type = 'compsub')
        $compsubIds = DB::table('project_assign')
            ->where('project_id', $projectId)
            ->where('entity_type', 'compsub')
            ->pluck('entity_id');

        $subconCompanies = SubconCompany::whereIn('id', $compsubIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        // 2. CompanyStaff IDs for this project (entity_type = 'staff')
        $staffIds = DB::table('project_assign')
            ->where('project_id', $projectId)
            ->where('entity_type', 'staff')
            ->pluck('entity_id');

        $assignedStaff = CompanyStaff::with('role:id,name')
            ->whereIn('id', $staffIds)
            ->orderBy('name')
            ->get(['id', 'name', 'role_id'])
            ->map(fn($s) => [
                'id'        => $s->id,
                'name'      => $s->name,
                'role_name' => optional($s->role)->name,
            ]);

        return response()->json([
            'subconCompanies' => $subconCompanies,
            'assignedStaff'   => $assignedStaff,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. STORE   →  POST  /incident
    // ─────────────────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $user      = Auth::user();
        $userStaff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$userStaff) {
            return redirect()->back()->withErrors(['reported_by' => 'User not associated with any staff record.']);
        }

        $validated = $request->validate([
            'incident_date'        => ['required', 'date'],
            'company_id'           => ['required', 'exists:company,id'],
            'project_id'           => ['required', 'exists:projects,id'],
            'subcon_company_id'    => ['nullable', 'exists:subcon_company,id'],
            'location'             => ['required', 'string', 'max:255'],
            'responsible_by'       => ['required', 'exists:company_staff,id'],
            'incident_id'          => ['required', 'exists:incident_types,id'],
            'injury_id'            => ['nullable', 'exists:injury_types,id'],
            'body_part'            => ['nullable', 'string', 'max:100'],
            'lti_worker_count'     => ['nullable', 'integer', 'min:0'],
            'lti_days_lost'        => ['nullable', 'integer', 'min:0'],
            'lti_man_hours_lost'   => ['nullable', 'integer', 'min:0'],
            'incident_description' => ['required', 'string'],
            'immediate_cause'      => ['required', 'string', 'max:255'],
            'underlying_cause'     => ['nullable', 'string', 'max:255'],
            'attachment_upload'    => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'immediate_action'     => ['required', 'string', 'max:255'],
            'corrective'           => ['nullable', 'string', 'max:255'],
            // 'manhours_lost'        => ['nullable', 'integer', 'min:0'],
        ]);

        if (!isset($validated['status'])) {
            $validated['status'] = 'open';
        }

        $validated['reported_by'] = $userStaff->id;
        $validated['status']    = 'open';
        $validated['review_by'] = null;

        Incident::create($validated);

        return redirect()
            ->route('incident.statistic')
            ->with('success', 'Incident report submitted successfully.');
    }
}
