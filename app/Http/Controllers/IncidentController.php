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
    /** Inspector / Supervisor / Manager can only name themselves as the responsible person. */
    private function reportsAsSelf(): bool
    {
        return in_array((int) Auth::user()->role_id, [3, 4, 7, 8], true);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $inspector = $request->routeIs('inspector.*');

        $userStaff = CompanyStaff::where('user_id', $user->id)->first();
        $companyId = $userStaff ? $userStaff->company_id : null;

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name']);

        // inspectors only report on the projects they are assigned to
        if ($inspector && $userStaff) {
            $assigned = DB::table('project_assign')
                ->where('entity_type', 'staff')->where('entity_id', $userStaff->id)->pluck('project_id');
            if ($assigned->isNotEmpty()) {
                $projects = $projects->whereIn('id', $assigned)->values();
            }
        }

        return Inertia::render('WSIS/Incident_Create', [
            'portal'          => $inspector ? 'inspector' : 'admin',
            'endpoints'       => $inspector ? [
                'store'       => '/inspector/incidents',
                'assignments' => '/inspector/incidents/project-assignments/',
                'staff'       => '/inspector/incidents/subcon-staff/',
                'back'        => '/inspector/incidents',
            ] : [
                'store'       => '/incident',
                'assignments' => '/incident/project-assignments/',
                'staff'       => '/incident/subcon-staff/',
                'back'        => '/incident-statistic',
            ],
            'selfStaffId'     => ($this->reportsAsSelf() && $userStaff) ? $userStaff->id : null,
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

        if ($this->reportsAsSelf()) {
            $me = CompanyStaff::where('user_id', Auth::id())->first();
            $staffIds = $me ? collect([$me->id]) : collect();
        }

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

    /**
     * Inspector view: every incident of the projects they are assigned to,
     * whoever reported it (not only their own reports).
     */
    public function inspectorIndex(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assigned = $staff
            ? DB::table('project_assign')->where('entity_type', 'staff')->where('entity_id', $staff->id)->pluck('project_id')
            : collect();

        $projects = Project::where('company_id', $user->company_id)
            ->when($assigned->isNotEmpty(), fn ($q) => $q->whereIn('id', $assigned))
            ->orderBy('name')
            ->get(['id', 'name']);

        $incidents = Incident::with([
                'project:id,name',
                'subcontractor:id,name',
                'incidentType:id,name',
                'injuryType:id,name',
                'reportedBy:id,name',
                'responsibleBy:id,name',
                'involvedStaff:id,name,role',
                'responses',
            ])
            ->whereIn('project_id', $projects->pluck('id'))
            ->orderByDesc('incident_date')
            ->get()
            ->map(fn (Incident $i) => [
                'id' => $i->id,
                'series_code' => $i->code,
                'date' => optional($i->incident_date)->format('Y-m-d H:i'),
                'project_id' => $i->project_id,
                'project' => optional($i->project)->name,
                'subcon' => optional($i->subcontractor)->name,
                'type' => optional($i->incidentType)->name,
                'injury' => optional($i->injuryType)->name,
                'body_part' => $i->body_part,
                'location' => $i->location,
                'description' => $i->incident_description,
                'immediate_cause' => $i->immediate_cause,
                'immediate_action' => $i->immediate_action,
                'corrective' => $i->corrective,
                'status' => $i->status,
                'reported_by' => optional($i->reportedBy)->name,
                'responsible' => optional($i->responsibleBy)->name,
                'mine' => $staff && (int) $i->reported_by === (int) $staff->id,
                'involved' => $i->involvedStaff->map(fn ($x) => ['id' => $x->id, 'name' => $x->name, 'role' => $x->role])->values(),
                'responses' => $i->responses->map(fn ($r) => [
                    'id' => $r->id, 'type' => $r->type, 'message' => $r->message, 'by' => $r->staff_name,
                    'role' => $r->role_label, 'at' => optional($r->created_at)->format('Y-m-d H:i'),
                ])->values(),
            ]);

        return Inertia::render('Inspector/Incidents', [
            'incidents' => $incidents,
            'projects' => $projects,
            'user' => $user,
        ]);
    }

    /** One incident of the inspector's projects, laid out like the manager's detail page (read only). */
    public function inspectorShow(int $id)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assigned = $staff
            ? DB::table('project_assign')->where('entity_type', 'staff')->where('entity_id', $staff->id)->pluck('project_id')
            : collect();

        $projectIds = Project::where('company_id', $user->company_id)
            ->when($assigned->isNotEmpty(), fn ($q) => $q->whereIn('id', $assigned))
            ->pluck('id');

        $i = Incident::with([
                'project:id,name', 'subcontractor:id,name', 'incidentType:id,name', 'injuryType:id,name',
                'reportedBy:id,name', 'responsibleBy:id,name', 'reviewedBy:id,name', 'involvedStaff:id,name,role', 'responses',
            ])
            ->whereIn('project_id', $projectIds)
            ->findOrFail($id);

        return Inertia::render('Inspector/IncidentShow', [
            'incident' => [
                'id' => $i->id,
                'series_code' => $i->code,
                'date' => optional($i->incident_date)->format('Y-m-d H:i'),
                'project' => optional($i->project)->name,
                'subcon' => optional($i->subcontractor)->name,
                'type' => optional($i->incidentType)->name,
                'injury' => optional($i->injuryType)->name,
                'body_part' => $i->body_part,
                'location' => $i->location,
                'description' => $i->incident_description,
                'immediate_cause' => $i->immediate_cause,
                'underlying_cause' => $i->underlying_cause,
                'immediate_action' => $i->immediate_action,
                'corrective' => $i->corrective,
                'status' => strtolower((string) ($i->status ?: 'open')),
                'reported_by' => optional($i->reportedBy)->name,
                'responsible' => optional($i->responsibleBy)->name,
                'reviewed_by' => optional($i->reviewedBy)->name,
                'attachment' => $i->attachment_upload ? \Illuminate\Support\Facades\Storage::url($i->attachment_upload) : null,
                'involved' => $i->involvedStaff->map(fn ($x) => ['id' => $x->id, 'name' => $x->name, 'role' => $x->role])->values(),
                'responses' => $i->responses->map(fn ($r) => [
                    'id' => $r->id, 'type' => $r->type, 'message' => $r->message, 'by' => $r->staff_name,
                    'role' => $r->role_label, 'at' => optional($r->created_at)->format('Y-m-d H:i'),
                ])->values(),
            ],
            'user' => $user,
        ]);
    }
    /** Staff of a subcontractor company, for the "who was involved" checklist (AJAX). */
    public function subconStaff($subconId)
    {
        return response()->json([
            'staff' => \App\Models\SubconStaff::where('company_id', $subconId)
                ->orderBy('name')
                ->get(['id', 'name', 'role']),
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
            'staff_ids'            => ['nullable', 'array'],
            'staff_ids.*'          => ['integer', 'exists:subcon_staff,id'],
        ]);

        $staffIds = $validated['staff_ids'] ?? [];
        unset($validated['staff_ids']);

        // only staff that belong to the chosen subcontractor can be linked
        if (!empty($validated['subcon_company_id'])) {
            $staffIds = \App\Models\SubconStaff::where('company_id', $validated['subcon_company_id'])
                ->whereIn('id', $staffIds)->pluck('id')->all();
        } else {
            $staffIds = [];
        }

        // never trust the posted value for roles that can only report as themselves
        if ($this->reportsAsSelf()) {
            $validated['responsible_by'] = $userStaff->id;
        }

        if (!isset($validated['status'])) {
            $validated['status'] = 'open';
        }

        $validated['reported_by'] = $userStaff->id;
        $validated['status']    = 'open';
        $validated['review_by'] = null;

        $incident = Incident::create($validated);
        $incident->involvedStaff()->sync($staffIds);

        if ($request->routeIs('inspector.*')) {
            return redirect('/inspector/incidents')->with('success', 'Incident report submitted successfully.');
        }

        return redirect()
            ->route('incident.statistic')
            ->with('success', 'Incident report submitted successfully.');
    }
}
