<?php

use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\ManhourController;
use App\Http\Controllers\SystemAdminController;
use App\Http\Controllers\SubconPublicController;
use App\Http\Controllers\Inspector\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Role;


// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

Route::get('/product', function () {
    return Inertia::render('PS/Home', []);
});



Route::get('/', function () {
    // real module prices for the pricing section
    $modules = \App\Models\Module::where('is_active', 'Y')
        ->orderBy('price', 'desc')
        ->get(['code', 'name', 'price'])
        ->map(fn ($m) => ['code' => $m->code, 'name' => $m->name, 'price' => (float) $m->price]);

    return Inertia::render('PublicWeb/Index', ['modules' => $modules]);
});

Route::get('/login', [AuthController::class, 'login'])->name('admin.login');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login');

Route::get('/register-view', [AuthController::class, 'register'])->name('admin.register');
Route::post('/register', [AuthController::class, 'store']);

Route::middleware(['auth', 'role:1'])->prefix('admin')->name('system.admin.')->group(function () {
    Route::get('/dashboard', [SystemAdminController::class, 'dashboard'])->name('dashboard');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/users', [SystemAdminController::class, 'storeUser'])->name('users.store');
    Route::put('/users/{user}', [SystemAdminController::class, 'updateUser'])->name('users.update');
    Route::get('/subscriptions', [SystemAdminController::class, 'subscriptions'])->name('subscriptions');
    Route::post('/subscriptions', [SystemAdminController::class, 'storeSubscription'])->name('subscriptions.store');
    Route::put('/subscriptions/{subscription}', [SystemAdminController::class, 'updateSubscription'])->name('subscriptions.update');
    Route::post('/packages', [SystemAdminController::class, 'storePackage'])->name('packages.store');
});


Route::prefix('subcon')->group(function () {
    // Staff access (limited permissions)
    Route::get('/{token}/staff', [SubconPublicController::class, 'show'])
        ->name('subcon.public.staff')
        ->defaults('role', 'staff');

    // Leader access (full permissions) – needs the secret leader key in the URL
    Route::get('/{token}/leader/{key}', [SubconPublicController::class, 'show'])
        ->name('subcon.public.leader')
        ->defaults('role', 'leader');

    // Old leader links (no key) fall back to the staff page
    Route::get('/{token}/leader', function ($token) {
        return redirect()->route('subcon.public.staff', ['token' => $token]);
    });

    // Common routes (both roles)
    Route::post('/{token}/staff', [SubconPublicController::class, 'storeStaff'])->name('subcon.public.staff.store');

    // Leader-only routes
    Route::put('/{token}/staff/{staffId}', [SubconPublicController::class, 'updateStaff'])->name('subcon.public.staff.update');
    Route::delete('/{token}/staff/{staffId}', [SubconPublicController::class, 'destroyStaff'])->name('subcon.public.staff.destroy');
});

Route::middleware(['auth', 'role:2'])->group(function () {
    Route::get('/module', [SubscriptionController::class, 'index'])->name('index.module');

    Route::get('/compliance-metrics', [ContentController::class, 'compMetrics'])
        ->name('compliance.metrics');
    Route::get('/penalty-settings', [ContentController::class, 'penalSetting'])
        ->name('penalty.settings');


    Route::get('/manage-employee', [ContentController::class, 'manageEmployee'])->name('manage.employee');

    Route::get('/manage-project', [ContentController::class, 'manageProject'])->name('manage.project');
    Route::put('/update-project/{id}', [ProjectController::class, 'updateProject'])->name('admin.projects.update');
    Route::delete('/delete-project/{id}', [ProjectController::class, 'destroyProject'])->name('admin.projects.destroy');
    Route::post('/admin/projects', [ProjectController::class, 'storeProject'])->name('admin.projects.store');
    Route::post('/store-company', [ProjectController::class, 'storeExCompany'])->name('admin.company.store');
    Route::post('/executor-staff', [ProjectController::class, 'storeExStaff'])->name('admin.staff.store');


    Route::get('/executor-project', [ContentController::class, 'executor'])
        ->name('executor');
    Route::get('/inspection', [ContentController::class, 'inspection'])
        ->name('inspection');
    Route::get('/non-conformance', [ContentController::class, 'nonConformance'])
        ->name('non.conformance');
    Route::get('/client-complaint', [ContentController::class, 'clientComplaint'])
        ->name('client.complaint');
    Route::get('/incident-statistic', [ContentController::class, 'inciStatistic'])
        ->name('incident.statistic');
    Route::get('/man-hour', [ContentController::class, 'manHour'])
        ->name('man.hour');
    Route::get('/man-hour/overall', [ContentController::class, 'manHourOverall'])
        ->name('man.hour.overall');
    Route::post('/man-hour', [ManhourController::class, 'store'])
        ->name('man.hour.store');
    Route::get('/man-hour/projects/{project}/subcontractors', [ManhourController::class, 'projectSubcontractors'])
        ->name('man.hour.project-subcontractors');
    Route::get('/daily-reports', [ContentController::class, 'dailyReports'])
        ->name('daily.reports');
    Route::get('/monthly-reports', [ContentController::class, 'monthlyReports'])
        ->name('monthly.reports');
    Route::get('/executors/{id}/staff', [ContentController::class, 'executorStaff'])
        ->name('executor.staff');
    Route::get('/toolbox-talks', [ContentController::class, 'toolbox'])->name('toolbox');

    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');

    Route::get('/list-project', [AuthController::class, 'listProject'])->name('admin.listproject');
    Route::get('/dashboard', [AuthController::class, 'index'])->name('admin.dashboard');


    Route::post('/post-compliance-metrics', [MetricController::class, 'storeMetrics'])->name('compliance-metrics.store');
    Route::put('/compliance-metrics/{id}', [MetricController::class, 'updateMetrics'])->name('compliance-metrics.update');
    Route::delete('/compliance-metrics/{id}', [MetricController::class, 'destroyMetrics'])->name('compliance-metrics.destroy');

    Route::post('/post-penalty-settings', [MetricController::class, 'storePenalty'])->name('penalty-settings.store');
    Route::put('/penalty-settings/{id}', [MetricController::class, 'updatePenalty'])->name('penalty-settings.update');
    Route::delete('/penalty-settings/{id}', [MetricController::class, 'destroyPenalty'])->name('penalty-settings.destroy');


    Route::get('/executors/{id}/project', [ContentController::class, 'executorProjDetails'])->name('executor.project.detail');
    Route::post('/projects/{project}/add-executor', [ProjectController::class, 'addExecutor'])->name('projects.add-executor');
    Route::put('/assignments/{assignment}', [ProjectController::class, 'updateAssignment'])->name('projects.update-assignment');
    Route::delete('/assignments/{assignment}', [ProjectController::class, 'destroyAssignment'])->name('projects.remove-assignment');

    Route::resource('inspections', InspectionController::class);
    Route::post('inspections/multiple', [InspectionController::class, 'storeMultiple'])->name('inspections.multiple');
    Route::delete('inspections/{inspection}/photos', [InspectionController::class, 'removePhotos'])->name('inspections.photos.remove');

    Route::post('toolbox/post', [InspectionController::class, 'storeToolbox'])->name('toolbox.store');

    Route::get('/dashboard', [InspectionController::class, 'dashboard'])
        ->name('dashboard.inspection');

    Route::post('/public/staff', [StaffController::class, 'publicStore'])->name('public.staff.store');
    Route::get('/public/staff/{company}', [StaffController::class, 'publicForm'])->name('public.staff.form');

    Route::patch('non-conformances/{nonConformance}/status', [InspectionController::class, 'updateNonConformanceStatus']);
    Route::patch('client-complaints/{clientComplaint}/status', [InspectionController::class, 'updateClientComplaintStatus']);

    //Incident Statistics (list)
    // Route::get('/incident-statistic',[IncidentController::class, 'inciStatistic'])->name('incident.statistic');

    // Incident Create form + Store
    Route::get('/incident/create', [IncidentController::class, 'create'])->name('incident.create');
    Route::post('/incident', [IncidentController::class, 'store'])->name('incident.store');
    Route::get('/incident/project-assignments/{projectId}', [IncidentController::class, 'getProjectAssignments']);

    Route::get('/roles', function () {
        return Role::select('id', 'name')->get(); // return only needed fields
    });

    // Route::get('/', function () {
    //     return Inertia::render('Dashboard');
    // })->middleware(['auth', 'verified'])->name('dashboard');

    // Route::middleware('auth')->group(function () {
    //     Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    //     Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    //     Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    // });

    Route::get('/debug/project/{id}', function ($id) {
        $project = \App\Models\Project::find($id);
        $assignments = \App\Models\ProjectAssign::all();

        $assignmentsStaff = \App\Models\ProjectAssign::where('entity_type', 'staff')->where('project_id', $id)->with('entity')->get();
        $assignmentsSubcon = \App\Models\ProjectAssign::where('entity_type', 'subcon')->where('project_id', $id)->with('entity')->get();
        $staff = \App\Models\CompanyStaff::all();
        $subconStaff = \App\Models\SubconStaff::all();

        $result = [
            // 'project' => $project,
            // 'assignments' => [],
            // 'staff' => $staff,
            // 'subconStaff' => $subconStaff,
            'assignmentsStaff' => $assignmentsStaff,
            'assignmentsSubcon' => $assignmentsSubcon,

        ];



        return response()->json($result);
    });
});



Route::middleware(['auth', 'role:4,7,8'])->prefix('inspector')->name('inspector.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Toolbox Talks
    Route::get('/toolbox-talks', [DashboardController::class, 'toolboxTalks'])->name('toolbox-talks');
    Route::get('/toolbox-talks/detail/{id}', [DashboardController::class, 'showToolboxTalkDetail'])->name('toolbox-talks.detail');
    Route::get('/toolbox-talks/create', [DashboardController::class, 'createToolboxTalk'])->name('toolbox-talks.create');
    Route::post('/toolbox-talks/post', [DashboardController::class, 'storeToolboxTalk'])->name('toolbox-talks.store');
    Route::get('/toolbox-talks/{id}', [DashboardController::class, 'showToolboxTalk'])->name('toolbox-talks.show');
    Route::get('/toolbox-talks/{id}/edit', [DashboardController::class, 'editToolboxTalk'])->name('toolbox-talks.edit');
    Route::put('/toolbox-talks/{id}', [DashboardController::class, 'updateToolboxTalk'])->name('toolbox-talks.update');
    Route::delete('/toolbox-talks/{id}', [DashboardController::class, 'destroyToolboxTalk'])->name('toolbox-talks.destroy');

    // Inspections
    Route::get('/inspections', [DashboardController::class, 'inspections'])->name('inspections');
    Route::get('/inspections/detail/{id}', [DashboardController::class, 'showInspection'])->name('inspector.inspections.show');
    Route::get('/inspections/create', [DashboardController::class, 'createInspection'])->name('inspections.create');
    Route::post('/inspections', [DashboardController::class, 'storeInspection'])->name('inspections.store');
    Route::get('/inspections/{id}', [DashboardController::class, 'showInspection'])->name('inspections.show');
    Route::get('/inspections/{id}/edit', [DashboardController::class, 'editInspection'])->name('inspections.edit');
    Route::put('/inspections/{id}', [DashboardController::class, 'updateInspection'])->name('inspections.update');
    Route::delete('/inspections/{id}', [DashboardController::class, 'destroyInspection'])->name('inspections.destroy');
    Route::get('/inspector/projects/{projectId}/subcon-companies', [DashboardController::class, 'getProjectSubconCompanies']);
    Route::post('/inspections/multiple', [DashboardController::class, 'storeMultipleInspections'])->name('inspector.inspections.multiple');

    // Projects
    Route::get('/projects', [DashboardController::class, 'projects'])->name('projects');
    Route::get('/projects/{id}', [DashboardController::class, 'showProject'])->name('projects.show');

    // Subcon Companies
    Route::get('/subcon-companies', [DashboardController::class, 'subconCompanies'])->name('subcon-companies');
    Route::get('/subcon-companies/{id}', [DashboardController::class, 'showSubconCompany'])->name('subcon-companies.show');
});

// Settings / profile (all roles)
Route::middleware('auth')->group(function () {
    // Logout must work for every role (inspector, staff, company...), not just role 2
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/settings', [ProfileController::class, 'edit'])->name('settings');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

// Company profile (company account only)
Route::middleware(['auth', 'role:2'])->group(function () {
    Route::get('/company-details', [\App\Http\Controllers\CompanyDetailsController::class, 'show'])->name('company.details');
    Route::put('/company-details', [\App\Http\Controllers\CompanyDetailsController::class, 'update'])->name('company.details.update');
});

