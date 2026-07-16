<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyStaff;
use App\Models\SubconCompany;
use App\Models\SubconStaff;
use Inertia\Inertia;
use App\Models\Role;
use App\Models\Project;
use App\Models\ProjectAssign;
use App\Models\User;
use App\Models\ComplianceMetrics;
use App\Models\PenaltySettings;
use App\Models\ToolboxTopic;
use App\Models\ToolboxTalks;
use App\Models\Inspection;
use App\Models\NoConformance;
use App\Models\ClientComplaint;
use App\Models\Incident;
use App\Models\Manhour;


use Illuminate\Support\Facades\Auth;
use illuminate\Http\Request;

class ContentController extends Controller
{
    public function compMetrics()
    {
        $companyId = Auth::user()->company_id;
        $metrics = ComplianceMetrics::where('company_id', $companyId)->get();

        return Inertia::render('WSIS/Compliance_Metrics', [
            'title' => 'Compliance Metrics',
            'metrics' => $metrics
        ]);
    }

    public function penalSetting()
    {
        $companyId = Auth::user()->company_id;

        // Get penalty settings from database for the current company
        $penaltySettings = PenaltySettings::where('company_id', $companyId)->get();

        return Inertia::render('WSIS/Penalty_Settings', [
            'title' => 'Penalty Settings',
            'metrics' => $penaltySettings, // Pass actual penalty settings data
            'auth' => [
                'user' => [
                    'company_id' => Auth::user()->company_id
                ]
            ]
        ]);
    }

    public function manageEmployee()
    {
        $companyId = Auth::user()->company_id;

        // Load staff with role relationship
        $staff = CompanyStaff::with('role')  // Add this to load role relationship
            ->where('company_id', $companyId)
            ->get();

        // Get all roles (not filtered by company)
        $roles = Role::whereIn('id', [4, 7, 8])
            ->select('id', 'display_name')->get();

        return Inertia::render('WSIS/Employee', [
            'title' => 'Manage Employee',
            'staff' => $staff,
            'roles' => $roles
        ]);
    }

    public function manageProject()
    {
        $user = Auth::user();

        $projects = Project::where('company_id', $user->company_id)

            ->get();


        return Inertia::render('WSIS/Project', [
            'title'    => 'Project Executor',
            'projects' => $projects,
        ]);
    }


    public function executor()
    {
        $user = Auth::user();

        // Example: only get projects belonging to the logged-in user's company
        $companies = SubconCompany::where('company_id', $user->company_id)->get();

        return Inertia::render('WSIS/Executor_Project', [
            'title' => 'Executor',
            'companies' => $companies, // 👈 send to React
        ]);
    }

    // For SubconCompany staff management
    public function executorStaff($id)
    {
        // Get subcon company with its staff using the correct relationship
        $company = SubconCompany::with('subconStaff')->findOrFail($id);

        return Inertia::render('WSIS/Executor_Staff', [
            'title' => $company->name . ' Staff',
            'company' => $company,
            'staff' => $company->subconStaff  // Use the correct relationship name
        ]);
    }


    public function executorProjDetails($id)
    {
        // Get project
        $project = Project::findOrFail($id);

        // Get all assignments with eager loading
        $assignmentsStaff = ProjectAssign::where('entity_type', 'staff')
            ->where('project_id', $id)
            ->with('entity')
            ->get();

        $assignmentsSubcon = ProjectAssign::where('entity_type', 'subcon')
            ->where('project_id', $id)
            ->with('entity')
            ->get();

        $assignmentsCompSub = ProjectAssign::where('entity_type', 'compsub')
            ->where('project_id', $id)
            ->with('entity')
            ->get();

        $formattedAssignments = [];

        // Process staff assignments
        foreach ($assignmentsStaff as $assign) {
            $staff = $assign->entity;
            if ($staff) {
                $formattedAssignments[] = [
                    'id' => $assign->id,
                    'entity_type' => 'staff',
                    'entity_id' => $staff->id,
                    'role_assignment' => $assign->role_assignment,
                    'staff_member' => [
                        'id' => $staff->id,
                        'name' => $staff->name,
                        'email' => $staff->email,
                        'role' => $staff->role,
                        'contact' => $staff->contact,
                        'company_id' => $staff->company_id,
                        'company_name' => optional($staff->company)->name ?? 'N/A'
                    ]
                ];
            }
        }

        // Process subcon assignments
        foreach ($assignmentsSubcon as $assign) {
            $subcon = $assign->entity;
            if ($subcon) {
                $formattedAssignments[] = [
                    'id' => $assign->id,
                    'entity_type' => 'subcon',
                    'entity_id' => $subcon->id,
                    'role_assignment' => $assign->role_assignment,
                    'subcon_staff' => [
                        'id' => $subcon->id,
                        'name' => $subcon->name,
                        'email' => $subcon->email,
                        'role' => $subcon->role,
                        'contact' => $subcon->contact,
                        'company_id' => $subcon->company_id,
                        'company_name' => optional($subcon->subconCompany)->name ?? 'N/A'
                    ]
                ];
            }
        }

        // Process company subcontractor assignments (compsub)
        foreach ($assignmentsCompSub as $assign) {
            $compsub = $assign->entity; // This will be a SubconCompany model
            if ($compsub) {
                $formattedAssignments[] = [
                    'id' => $assign->id,
                    'entity_type' => 'compsub',
                    'entity_id' => $compsub->id,
                    'role_assignment' => $assign->role_assignment,
                    'compsub_company' => [ // Changed from compsub_staff to compsub_company
                        'id' => $compsub->id,
                        'name' => $compsub->name,
                        'short_name' => $compsub->short_name,
                        'email' => $compsub->email,
                        'contact' => $compsub->contact,
                        'company_name' => $compsub->name // Company name is the company itself
                    ]
                ];
            }
        }

        // Get available staff (not assigned)
        $assignedStaffIds = ProjectAssign::where('project_id', $id)
            ->where('entity_type', 'staff')
            ->pluck('entity_id')
            ->toArray();

        $availableStaff = CompanyStaff::with('company', 'role')
            ->whereIn('role_id', [4, 8, 7])
            ->whereNotIn('id', $assignedStaffIds)
            ->get();

        // Get available subcon staff (not assigned)
        $assignedSubconIds = ProjectAssign::where('project_id', $id)
            ->where('entity_type', 'subcon')
            ->pluck('entity_id')
            ->toArray();

        $availableSubconStaff = SubconStaff::with('subconCompany')
            ->whereNotIn('id', $assignedSubconIds)
            ->get();

        // Get available company subcontractors (not assigned - compsub)
        $assignedCompSubIds = ProjectAssign::where('project_id', $id)
            ->where('entity_type', 'compsub')
            ->pluck('entity_id')
            ->toArray();

        $availableCompSub = SubconCompany::whereNotIn('id', $assignedCompSubIds)->get();

        return Inertia::render('WSIS/Executor_Project_Details', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'status' => $project->status,
                'progress' => $project->progress,
            ],
            'assignments' => $formattedAssignments,
            'availableStaff' => $availableStaff,
            'availableSubconStaff' => $availableSubconStaff,
            'availableCompSub' => $availableCompSub,
            'flash' => session('flash'),
        ]);
    }


    public function inspection()
    {
        // Get all projects with their assigned compsub companies
        $projects = Project::with(['projectAssign' => function ($query) {
            $query->where('entity_type', 'compsub')->with('entity');
        }])->get()->map(function ($project) {
            // Get all assigned subcontractor companies for this project
            $assignedSubconCompanies = $project->projectAssign->map(function ($assignment) {
                $company = $assignment->entity;
                return $company ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'short_name' => $company->short_name ?? null,
                    'email' => $company->email,
                    'contact' => $company->contact,
                    'address' => $company->address,
                    'type' => 'compsub'
                ] : null;
            })->filter()->values();

            return [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'assigned_companies' => $assignedSubconCompanies,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'status' => $project->status
            ];
        });

        // Get all staff with role_id = 7 (Inspectors)
        // $projectIds = $projects->pluck('id')->toArray();

        // $inspectorRows = ProjectAssign::where('project_assign.entity_type', 'staff')
        //     ->whereIn('project_assign.project_id', $projectIds)
        //     ->join('company_staff', 'project_assign.entity_id', '=', 'company_staff.id')
        //     ->select(
        //         'company_staff.id',
        //         'company_staff.name',
        //         'company_staff.email',
        //         'company_staff.contact',
        //         'company_staff.role_id',
        //         'company_staff.company_id',
        //         'project_assign.project_id',
        //         'project_assign.role_assignment as project_role'
        //     )
        //     ->get();

        // // Group as { project_id: [inspector, ...] }
        // $inspectors = $inspectorRows->groupBy('project_id');

        $user = Auth::user();

        $authStaff = CompanyStaff::where('user_id', $user->id)->first();

        // Prepare auth_inspector data
        $authInspector = $authStaff ? [
            'id'         => $authStaff->id,
            'name'       => $authStaff->name,
            'email'      => $authStaff->email,
            'contact'    => $authStaff->contact,
            'company_id' => $authStaff->company_id,
        ] : null;

        // dd($inspectors);

        // Get all executor companies (active companies) - for Toolbox
        $all_companies = Company::where('status', 'active')->get()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'short_name' => $company->short_name,
                'email' => $company->email,
                'contact' => $company->contact,
                'address' => $company->address
            ];
        });

        // Get all topics
        $topics = ToolboxTopic::all(['id', 'name', 'description']);

        // Get inspections
        $inspections = Inspection::with(['project', 'company', 'topic', 'inspector', 'subconCompany'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($inspection) {
                return [
                    'id' => $inspection->id,
                    'inspection_name' => $inspection->inspection_name ?? null,
                    'inspection_date' => $inspection->inspection_date,
                    'location' => $inspection->location,
                    'evaluation' => $inspection->evaluation,
                    'description' => $inspection->description,
                    'photo' => $inspection->photo,
                    'project' => $inspection->project ? [
                        'id' => $inspection->project->id,
                        'name' => $inspection->project->name,
                    ] : null,
                    'company' => $inspection->company ? [
                        'id' => $inspection->company->id,
                        'name' => $inspection->company->name,
                    ] : null,
                    'subconCompany' => $inspection->subconCompany ? [
                        'id' => $inspection->subconCompany->id,
                        'name' => $inspection->subconCompany->name,
                    ] : null,
                    'topic' => $inspection->topic ? [
                        'id' => $inspection->topic->id,
                        'name' => $inspection->topic->name,
                    ] : null,
                    'inspector' => $inspection->inspector ? [
                        'id' => $inspection->inspector->id,
                        'name' => $inspection->inspector->name,
                    ] : null,
                    'created_by' => $inspection->created_by,
                    'created_at' => $inspection->created_at,
                    'updated_at' => $inspection->updated_at,
                ];
            });

        // Get toolbox talks
        $toolboxTalks = ToolboxTalks::with(['project', 'topics', 'CompanyStaff'])
            ->orderBy('inspection_date', 'desc')
            ->get()
            ->map(function ($talk) {
                return [
                    'id' => $talk->id,
                    'name' => $talk->inspection_name,
                    'date' => $talk->inspection_date,
                    'project' => $talk->project ? $talk->project->name : 'N/A',
                    'topics' => $talk->topics->pluck('name')->toArray(),
                    'attendance' => $talk->total_attended,
                    'status' => $talk->conducted,
                    'staffinpection' => $talk->CompanyStaff ? $talk->CompanyStaff->name : 'N/A',
                ];
            });

        $staffNames = CompanyStaff::whereIn('id', $toolboxTalks->pluck('inspection_by'))->pluck('name', 'id');

        

        // dd($inspections);

        return Inertia::render('WSIS/Inspection', [
            'title' => 'Inspection',
            'projects' => $projects,
            'auth_inspector' => $authInspector, // Add inspectors to props
            'all_companies' => $all_companies,
            'topics' => $topics,
            'inspections' => $inspections,
            'toolboxTopics' => $topics,
            'toolboxTalks' => $toolboxTalks,
            'staffinpection' => $staffNames,
        ]);
    }


    public function toolbox()
    {
        // Load topics
        $topics = ToolboxTopic::all()->map(function ($topic) {
            return [
                'id'          => $topic->id,
                'name'        => $topic->name,
                'description' => $topic->description,
            ];
        });


        $talks = ToolboxTalks::with(['project', 'topics', 'CompanyStaff'])
            ->get()
            ->map(function ($talk) {
                $staffName = $talk->CompanyStaff ? $talk->CompanyStaff->name : 'No Staff Found';

                // Debug log
                \Log::info("Talk ID {$talk->id} - Staff: {$staffName}");

                return [
                    'id'         => $talk->id,
                    'name'       => $staffName,  // This should be the staff name
                    'date'       => $talk->inspection_date,
                    'project'    => $talk->project ? $talk->project->name : 'No Project',
                    'topics'     => $talk->topics->pluck('name')->toArray(),
                    'attendance' => $talk->total_attended,
                    'status'     => $talk->conducted,
                ];
            });

        $staffNames = CompanyStaff::whereIn('id', $talks->pluck('inspection_by'))->pluck('name', 'id');

        dd($staffNames);


        // Load projects for the dropdown
        $projects = Project::all();

        return Inertia::render('WSIS/Toolbox', [
            'title'         => 'Toolbox',
            'toolboxTopics' => $topics,
            'toolboxTalks'  => $talks,
            'projects'      => $projects,
            'stafftoolbox'    => $talk->CompanyStaff ? $talk->CompanyStaff->name : 'N/A',
        ]);
    }




    public function nonConformance()
    {
        $companyId = Auth::user()->company_id;

        $nonConformances = NoConformance::with([
            'inspection.project',
            'inspection.topic',
            'inspection.subconCompany',
            'inspection.inspector',
        ])
            ->whereHas('inspection.project', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->latest()
            ->get();

        return Inertia::render('WSIS/Non_Conformance', [
            'title'           => 'Non-Conformance',
            'nonConformances' => $nonConformances,
        ]);
    }

    public function clientComplaint()
    {
        $companyId = Auth::user()->company_id;

        $clientComplaints = ClientComplaint::with([
            'inspection.project',
            'inspection.topic',
            'inspection.subconCompany',
            'inspection.inspector',
        ])
            ->whereHas('inspection.project', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->latest()
            ->get();

        return Inertia::render('WSIS/Client_Complaint', [
            'title'            => 'Client Complaint',
            'clientComplaints' => $clientComplaints,
        ]);
    }

    public function inciStatistic(Request $request)
    {
        $query = Incident::query()
            ->with([
                'project:id,name',
                'company:id,name',
                'subcontractor:id,name',
                'incidentType:id,name',
                'injuryType:id,name',
                'reportedBy:id,name,role_id',
                'reportedBy.role:id,name',
                'responsibleBy:id,name,role_id',
                'responsibleBy.role:id,name',
            ])
            ->when($request->year,  fn($q) => $q->whereYear('incident_date',  $request->year))
            ->when($request->month, fn($q) => $q->whereMonth('incident_date', $request->month));

        $incidents = $query
            ->orderByDesc('incident_date')
            ->get()
            ->map(function (Incident $inc) {
                // Determine which incident-type columns to flag (1 or 0)
                // based on the related IncidentType name.
                $typeName = optional($inc->incidentType)->name ?? '';

                return [
                    'id'                     => $inc->id,

                    // ── Basic Information ──────────────────────────────────────
                    'incident_year'          => $inc->incident_date?->format('Y'),
                    'incident_month'         => $inc->incident_date?->format('m'),   // '01'–'12'
                    'incident_type'          => $typeName,
                    'injury_type'            => optional($inc->injuryType)->name,
                    'body_part'              => $inc->body_part,
                    'location'               => $inc->location,
                    'project_name'           => optional($inc->project)->name,
                    'company'                => optional($inc->company)->name,
                    'subcon_company'         => optional($inc->subcontractor)->name,
                    // ── Incident Classification counts ─────────────────────────
                    // Each column is 1 if this record matches that type, 0 otherwise.
                    // Adjust the string comparisons to match your IncidentType seed data.
                    'fatality'               => str_contains(strtolower($typeName), 'fatality')               ? 1 : 0,
                    'occup_health_complaint' => str_contains(strtolower($typeName), 'occup')                  ? 1 : 0,
                    'lti'                    => str_contains(strtolower($typeName), 'lost time')               ? 1 : 0,
                    'first_aid_treatment'    => str_contains(strtolower($typeName), 'first aid')               ? 1 : 0,
                    'fire_cases'             => str_contains(strtolower($typeName), 'fire')                    ? 1 : 0,
                    'environmental_issue'    => str_contains(strtolower($typeName), 'environment')             ? 1 : 0,
                    'road_accident'          => str_contains(strtolower($typeName), 'road')                    ? 1 : 0,
                    'total'                  => 1, // each row is 1 incident

                    // ── Personnel ──────────────────────────────────────────────
                    'responsible_person'     => optional($inc->responsibleBy)->name,
                    'position'               => optional(optional($inc->responsibleBy)->role)->name,
                    'reported_by'            => optional($inc->reportedBy)->name,
                    'reporter_position'      => optional(optional($inc->reportedBy)->role)->name,

                    // ── LTI Details ────────────────────────────────────────────
                    'lti_worker_count'       => $inc->lti_worker_count,
                    'lti_days_lost'          => $inc->lti_days_lost,
                    'lti_man_hours_lost'     => $inc->lti_man_hours_lost,

                    // ── Case Details ───────────────────────────────────────────
                    'incident_description'   => $inc->incident_description,
                    'immediate_cause'        => $inc->immediate_cause,
                    'underlying_cause'       => $inc->underlying_cause,

                    // ── Follow-up & Actions ────────────────────────────────────
                    'immediate_action'       => $inc->immediate_action,
                    'corrective'             => $inc->corrective,

                    // ── Impact & Recording ─────────────────────────────────────
                    'lti_man_hours_lost'     => $inc->lti_man_hours_lost,
                    'attachment_upload'      => $inc->attachment_upload
                        ? asset('storage/' . $inc->attachment_upload)
                        : null,

                    // ── Status ─────────────────────────────────────────────────
                    'status'                 => $inc->status, // 'open' | 'in progress' | 'closed'
                ];
            });

        return Inertia::render('WSIS/Incident_Statistic', [
            'title'     => 'Incident Statistic',
            'incidents' => $incidents,
        ]);
    }

    public function manHour()
    {
        $staff = CompanyStaff::where('user_id', Auth::id())->first();
        $companyId = $staff?->company_id;

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('WSIS/Man_Hour', [
            'title' => 'Company Manhours',
            'projects' => $projects,
            'entries' => $this->manhourEntries($companyId),
        ]);
    }

    public function manHourOverall()
    {
        $staff = CompanyStaff::where('user_id', Auth::id())->first();

        return Inertia::render('WSIS/Man_Hour_Overall', [
            'title' => 'Overall Manhours',
            'entries' => $this->manhourEntries($staff?->company_id),
        ]);
    }

    private function manhourEntries($companyId)
    {
        return Manhour::with([
                'project:id,name',
                'subcontractor:id,name',
            ])
            ->where('company_id', $companyId)
            ->latest('created_at')
            ->latest('work_date')
            ->latest('id')
            ->get()
            ->map(fn (Manhour $entry) => [
                'id' => $entry->id,
                'work_date' => $entry->work_date->format('Y-m-d'),
                'created_at' => $entry->created_at?->format('Y-m-d H:i:s'),
                'project_name' => $entry->project?->name,
                'subcontractor_name' => $entry->subcontractor?->name,
                'worker_count' => $entry->worker_count,
                'working_hours' => (float) $entry->working_hours,
                'manhours' => round($entry->worker_count * (float) $entry->working_hours, 2),
            ]);
    }

    public function dailyReports()
    {
        return Inertia::render('WSIS/Daily_Reports', [
            'title' => 'Daily Reports',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }

    public function monthlyReports()
    {
        return Inertia::render('WSIS/Monthly_Reports', [
            'title' => 'Monthly Reports',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }
}
