<?php

namespace App\Http\Controllers;

use App\Models\Executor;
use Inertia\Inertia;
use App\Models\Role;
use App\Models\Project;
use App\Models\User;
use App\Models\ComplianceMetrics;
use App\Models\PenaltySettings;
use App\Models\ToolboxTopic;
use App\Models\ToolboxTalks;
use App\Models\Inspection;

use Illuminate\Support\Facades\Auth;

class ContentController extends Controller
{
    public function compMetrics()
    {
        $companyId = Auth::user()->company_id;
        $metrics = ComplianceMetrics::where('company_id', $companyId)->get();

        return Inertia::render('Contents/Compliance_Metrics', [
            'title' => 'Compliance Metrics',
            'metrics' => $metrics
        ]);
    }

    public function penalSetting()
    {
        $companyId = Auth::user()->company_id;

        // Get penalty settings from database for the current company
        $penaltySettings = PenaltySettings::where('company_id', $companyId)->get();

        return Inertia::render('Contents/Penalty_Settings', [
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

        $staff = User::with('role')
            ->where('company_id', $companyId)
            ->get();

        // Get all roles (not filtered by company)
        $roles = Role::select('id', 'display_name')->get();

        return Inertia::render('Contents/Employee', [
            'title' => 'Manage Employee',
            'staff' => $staff,
            'roles' => $roles
        ]);
    }

    public function manageProject()
    {
        $user = Auth::user();

        $projects = Project::where('company_id', $user->company_id)
            ->with('executorCompanies.executorCompany') // <- eager load
            ->get();


        return Inertia::render('Contents/Project', [
            'title'    => 'Project Executor',
            'projects' => $projects,
        ]);
    }






    public function executor()
    {
        $user = Auth::user();

        // Example: only get projects belonging to the logged-in user's company
        $companies = Executor::where('company_id', $user->company_id)->get();

        return Inertia::render('Contents/Executor_Project', [
            'title' => 'Executor',
            'companies' => $companies, // 👈 send to React
        ]);
    }

    public function executorStaff($id)
    {
        $company = Executor::with('staff')->findOrFail($id);

        return Inertia::render('Contents/Executor_Staff', [
            'title' => $company->name . ' Staff',
            'company' => $company,
            'staff' => $company->staff
        ]);
    }

    // public function executorProjDetails($id)
    // {
    //     $project = Project::with(['executorAssignments.executorCompany'])->findOrFail($id);

    //     // Get available executors (those not already assigned to this project)
    //     $assignedExecutorIds = $project->executorAssignments->pluck('executor_company_id');
    //     $availableExecutors = Executor::whereNotIn('id', $assignedExecutorIds)->get();

    //     return Inertia::render('Contents/Executor_Project_Details', [
    //         'title' => $project->name . ' Staff',
    //         'project' => $project,
    //         'assignments' => $project->executorAssignments ?? collect(),
    //         'executors' => $project->executorAssignments
    //             ? $project->executorAssignments->pluck('executorCompany')
    //             : collect(),
    //         'availableExecutors' => $availableExecutors // Make sure this is included
    //     ]);
    // }

    // public function executorProjDetails($id)
    // {
    //     // $project = Project::with([
    //     //     'executorCompanies' => function($query) {
    //     //         $query->withCount('staff');
    //     //     },
    //     //     'executorAssignments' => function($query) {
    //     //         $query->with(['executorCompany' => function($q) {
    //     //             $q->withCount('staff');
    //     //         }]);
    //     //     }
    //     // ])->findOrFail($id);

    //     $project = Project::with([
    //         'executorAssignments.executorCompany' => function($query) {
    //             $query->withCount('staff'); // This adds staff_count
    //         }
    //     ])->findOrFail($id);

    //     $availableExecutors = Executor::whereDoesntHave('projects', function($query) use ($id) {
    //         $query->where('projects.id', $id);
    //     })->get();

    //     $executors = Executor::with('staff')->get();

    //     return Inertia::render('Contents/Executor_Project_Details', [
    //         'title' => $project->name . ' Dashboard',
    //         'project' => $project,
    //         'executors' => $project->executorCompanies,
    //         'assignments' => $project->executorAssignments,
    //         'availableExecutors' => $availableExecutors
    //     ]);
    // }

    // public function executorProjDetails($id)
    // {
    //     $project = Project::with([
    //         'executorAssignments.executorCompany.staff' // chain until staff
    //     ])->findOrFail($id);

    // foreach ($project->executorAssignments as $assignment) {
    //     $company = $assignment->executorCompany;
    //     dump($company->name, $company->staff); // staff should show here
    // }

    //     // Get executors not yet assigned
    //     $availableExecutors = Executor::whereDoesntHave('projects', function($query) use ($id) {
    //         $query->where('projects.id', $id);
    //     })->withCount('staff')->get();

    //     return Inertia::render('Contents/Executor_Project_Details', [
    //         'title' => $project->name . ' Dashboard',
    //         'project' => $project,
    //         'companies' => $company,
    //         'assignments' => $project->executorAssignments,
    //         'availableExecutors' => $availableExecutors,
    //     ]);
    // }

    // public function executorProjDetails($id)
    // {
    //     $project = Project::with([
    //         'executorAssignments.entity' => function ($query) {
    //             // If entity is Executor, eager load staff_count
    //             if ($query->getModel() instanceof \App\Models\Executor) {
    //                 $query->withCount('staff');
    //             }
    //         }
    //     ])->findOrFail($id);

    //     // Collect only companies from assignments
    //     $companies = $project->executorAssignments
    //         ->filter(fn($assign) => $assign->entity_type === Executor::class) // only Executors
    //         ->map(fn($assign) => $assign->entity) // map to actual company model
    //         ->filter() // remove null
    //         ->values();

    //     // Get executors not yet assigned to this project
    //     $availableExecutors = Executor::whereDoesntHave('projects', function ($query) use ($id) {
    //         $query->where('projects.id', $id);
    //     })->withCount('staff')->get();

    //     return Inertia::render('Contents/Executor_Project_Details', [
    //         'title'             => $project->name,
    //         'project'           => $project,
    //         'companies'         => $companies, // ✅ all assigned companies
    //         'assignments'       => $project->executorAssignments, // ✅ includes employees + companies
    //         'availableExecutors'=> $availableExecutors,
    //     ]);
    // }

    // public function executorProjDetails($id)
    // {

    //      $companyId = Auth::user()->company_id;

    //     // Load project with assignments and their companies
    //     $project = Project::with([
    //         'executorAssignments' => function($query) {
    //             $query->where('entity_type', 'CP')
    //                   ->with(['entity' => function($q) {
    //                       $q->withCount('staff');
    //                   }]);
    //         }
    //     ])->findOrFail($id);

    //     // Get assigned companies (already loaded with staff_count)
    //     $companies = $project->executorAssignments
    //         ->filter(fn($assign) => $assign->entity_type === 'CP' && $assign->entity)
    //         ->map(fn($assign) => $assign->entity)
    //         ->unique('id')
    //         ->values();

    //     // Get available executors not assigned to this project
    //     $availableExecutors = Executor::whereDoesntHave('assignments', function($query) use ($id) {
    //         $query->where('project_id', $id);
    //     })->withCount('staff')->get();

    //     // $availableEmployees = User::where('role_id', '4')
    //     // ->where('company_id', $companyId)
    //     // ->whereDoesntHave('executorAssignments', function($query) use ($id) {
    //     //     $query->where('project_id', $id)
    //     //           ->where('entity_type', 'EM');
    //     // })
    //     // ->get();

    //     $availableEmployees = User::where('role_id', '4')
    //     ->where('company_id', $companyId)
    //     ->whereDoesntHave('executorAssignments', function($query) use ($id) {
    //         $query->where('project_id', $id);
    //     })
    //     ->get();

    //     return Inertia::render('Contents/Executor_Project_Details', [
    //         'title' => $project->name,
    //         'project' => [
    //             'id' => $project->id,
    //             'name' => $project->name,
    //             'location' => $project->location,
    //             'start_date' => $project->start_date,
    //             'end_date' => $project->end_date,
    //             'status' => $project->status,
    //             'progress' => $project->progress
    //         ],
    //         'companies' => $companies->map(fn($c) => [
    //             'id' => $c->id,
    //             'name' => $c->name,
    //             'short_name' => $c->short_name,
    //             'email' => $c->email,
    //             'contact' => $c->contact,
    //             'address' => $c->address,
    //             'status' => $c->status,
    //             'staff_count' => $c->staff_count,
    //             'staff' => $c->staff->map(fn($s) => [
    //                 'id' => $s->id,
    //                 'name' => $s->name,
    //                 'role' => $s->role
    //             ])
    //         ]),
    //         'assignments' => $project->executorAssignments->map(fn($assign) => [
    //             'id' => $assign->id,
    //             'role_assignment' => $assign->role_assignment,
    //             'executor_company' => $assign->entity ? [
    //                 'id' => $assign->entity->id,
    //                 'name' => $assign->entity->name,
    //                 'email' => $assign->entity->email,
    //                 'address' => $assign->entity->address,
    //                 'staff_count' => $assign->entity->staff_count
    //             ] : null
    //         ]),
    //         'availableExecutors' => $availableExecutors->map(fn($e) => [
    //             'id' => $e->id,
    //             'name' => $e->name,
    //             'short_name' => $e->short_name,
    //             'staff_count' => $e->staff_count
    //         ]),
    //         'availableEmployees' => $availableEmployees->map(fn($e) => [
    //             'id' => $e->id,
    //             'name' => $e->name,
    //             'position' => $e->position // or role name
    //         ])
    //     ]);
    // }

    public function executorProjDetails($id)
    {
        $companyId = Auth::user()->company_id;

        // Load project with assignments for BOTH companies and employees
        $project = Project::with([
            'executorAssignments' => function ($query) {
                $query->with(['entity' => function ($q) {
                    // Only apply withCount if entity is Executor
                    if ($q->getModel() instanceof Executor) {
                        $q->withCount('staff');
                    }
                }]);
            }
        ])->findOrFail($id);


        // Get assigned companies
        $companies = $project->executorAssignments
            ->filter(fn($assign) => $assign->entity_type === 'CP' && $assign->entity)
            ->map(function ($assign) {
                $company = $assign->entity;
                $company->staff_count = $company->staff()->count(); // calculate here
                return $company;
            })
            ->unique('id')
            ->values();

        // Get available executors not assigned to this project
        $availableExecutors = Executor::whereDoesntHave('assignments', function ($query) use ($id) {
            $query->where('project_id', $id);
        })->withCount('staff')->get();



        $availableEmployees = User::where('role_id', '4')
            ->where('company_id', $companyId)
            ->whereDoesntHave('executorAssignments', function ($query) use ($id) {
                $query->where('project_id', $id);
            })
            ->get();

        // Format assignments with proper data for both companies and employees
        $assignments = $project->executorAssignments->map(fn($assign) => [
            'id' => $assign->id,
            'entity_type' => $assign->entity_type, // Add entity_type
            'role_assignment' => $assign->role_assignment,
            'executor_company' => $assign->entity_type === 'CP' && $assign->entity ? [
                'id' => $assign->entity->id,
                'name' => $assign->entity->name,
                'email' => $assign->entity->email,
                'address' => $assign->entity->address,
                'staff_count' => $assign->entity->staff_count
            ] : null,
            'employee' => $assign->entity_type === 'EM' && $assign->entity ? [
                'id' => $assign->entity->id,
                'name' => $assign->entity->name,
                'email' => $assign->entity->email,
                'position' => $assign->entity->position
            ] : null
        ]);

        return Inertia::render('Contents/Executor_Project_Details', [
            'title' => $project->name,
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'status' => $project->status,
                'progress' => $project->progress
            ],
            'companies' => $companies->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'short_name' => $c->short_name,
                'email' => $c->email,
                'contact' => $c->contact,
                'address' => $c->address,
                'status' => $c->status,
                'staff_count' => $c->staff_count,
                'staff' => $c->staff->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'role' => $s->role
                ])
            ]),
            'assignments' => $assignments, // Use the formatted assignments
            'availableExecutors' => $availableExecutors->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'short_name' => $e->short_name,
                'staff_count' => $e->staff_count
            ]),
            'availableEmployees' => $availableEmployees->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'position' => $e->position
            ])
        ]);
    }


public function inspection()
{
    // Get projects with their assigned executor companies
    $projects = Project::with(['executorAssignments' => function($query) {
        $query->where('entity_type', 'CP')->with('executorCompany');
    }])->get()->map(function ($project) {
        // Get all assigned companies for this project
        $assignedCompanies = $project->executorAssignments->map(function ($assignment) {
            return $assignment->executorCompany ? [
                'id' => $assignment->executorCompany->id,
                'name' => $assignment->executorCompany->name,
                'short_name' => $assignment->executorCompany->short_name,
                'email' => $assignment->executorCompany->email,
                'contact' => $assignment->executorCompany->contact,
                'address' => $assignment->executorCompany->address
            ] : null;
        })->filter()->values(); // Remove null values and reset keys
        
        return [
            'id' => $project->id,
            'name' => $project->name,
            'location' => $project->location,
            'assigned_companies' => $assignedCompanies, // This is what the frontend expects
            'start_date' => $project->start_date,
            'end_date' => $project->end_date,
            'status' => $project->status
        ];
    });

    // Get all executor companies
    $all_companies = Executor::where('status', 'active')->get()->map(function ($company) {
        return [
            'id' => $company->id,
            'name' => $company->name,
            'short_name' => $company->short_name,
            'email' => $company->email,
            'contact' => $company->contact,
            'address' => $company->address
        ];
    });

    $topics = ToolboxTopic::all()->map(function ($topic) {
        return [
            'id' => $topic->id,
            'name' => $topic->name,
            'description' => $topic->description
        ];
    });

    $topics = ToolboxTopic::all(['id', 'name', 'description']);

    // Get inspections with related data
    $inspections = Inspection::with(['project', 'executorCompany', 'topic'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($inspection) {
            return [
                'id' => $inspection->id,
                'inspection_name' => $inspection->inspection_name,
                'inspection_date' => $inspection->inspection_date,
                'location' => $inspection->location,
                'evaluation' => $inspection->evaluation,
                'description' => $inspection->description,
                'photo' => $inspection->photo,
                'project' => $inspection->project ? [
                    'id' => $inspection->project->id,
                    'name' => $inspection->project->name,
                ] : null,
                'executor_company' => $inspection->executorCompany ? [
                    'id' => $inspection->executorCompany->id,
                    'name' => $inspection->executorCompany->name,
                ] : null,
                'topic' => $inspection->topic ? [
                    'id' => $inspection->topic->id,
                    'name' => $inspection->topic->name,
                ] : null,
                'created_by' => $inspection->created_by,
                'created_at' => $inspection->created_at,
                'updated_at' => $inspection->updated_at,
            ];
        });

        $toolboxTalks = ToolboxTalks::with(['project', 'topics'])
    ->orderBy('inspection_date', 'desc') // Sort by date descending (newest first)
    // ->orderBy('created_at', 'desc')      // Secondary sort by creation date
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
        ];
    });

    return Inertia::render('Contents/Inspection', [
        'title' => 'Inspection',
        'projects' => $projects,
        'all_companies' => $all_companies,
        'topics' => $topics,
        'inspections' => $inspections,
        'toolboxTopics' => $topics,
        'toolboxTalks' => $toolboxTalks,
    ]);
}


public function toolbox()
{
    $topics = ToolboxTopic::all()->map(function ($topic) {
        return [
            'id' => $topic->id,
            'name' => $topic->name,
            'description' => $topic->description
        ];
    });

    $talks = ToolboxTalks::with(['project', 'topics'])->get()->map(function ($talk) {
    return [
        'id' => $talk->id,
        'name' => $talk->inspection_name,
        'date' => $talk->inspection_date,
        'project' => $talk->project ? $talk->project->name : 'N/A',
        'topics' => $talk->topics->pluck('name')->toArray(), // 👈 this is an array
        'attendance' => $talk->total_attendance,
        'status' => $talk->conducted === 'yes' ? 'Completed' : 'Pending',
    ];
});


    return Inertia::render('Contents/Toolbox', [
        'title' => 'Toolbox',
        'toolboxTopics' => $topics,
        'toolboxTalks' => $talks,
    ]);
}




    public function nonConformance()
    {
        return Inertia::render('Contents/Non_Conformance', [
            'title' => 'Non-Conformance',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }

    public function clientComplaint()
    {
        return Inertia::render('Contents/Client_Complaint', [
            'title' => 'Client Complaint',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }

    public function inciStatistic()
    {
        return Inertia::render('Contents/Incident_Statistic', [
            'title' => 'Incident Statistic',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }

    public function manHour()
    {
        return Inertia::render('Contents/Man_Hour', [
            'title' => 'Man Hour',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }

    public function dailyReports()
    {
        return Inertia::render('Contents/Daily_Reports', [
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
        return Inertia::render('Contents/Monthly_Reports', [
            'title' => 'Monthly Reports',
            // Add any other data you want to pass
            'metrics' => [
                'total_compliance' => 85,
                'pending_items' => 3
            ]
        ]);
    }


    
}
