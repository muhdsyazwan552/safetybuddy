<?php

use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\CompanyEmailVerificationController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\ManhourController;
use App\Http\Controllers\SystemAdminController;
use App\Http\Controllers\MetricController;
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
    return Inertia::render('PublicWeb/Index', [
        'subscriptionPlans' => \App\Models\SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get(),
    ]);
});

Route::get('/login', [AuthController::class, 'login'])->name('admin.login');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login');

Route::get('/register-view', [AuthController::class, 'register'])->name('admin.register');
Route::post('/register', [AuthController::class, 'store'])->middleware('throttle:5,1');

Route::get('/verify-email', [CompanyEmailVerificationController::class, 'notice'])->name('verification.notice');
Route::get('/verify-email/{id}/{hash}', [CompanyEmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
Route::post('/email/verification-notification', [CompanyEmailVerificationController::class, 'resend'])
    ->middleware('throttle:3,1')->name('verification.send');

Route::middleware(['auth', 'role:1'])->prefix('admin')->name('system.admin.')->group(function () {
    Route::get('/dashboard', [SystemAdminController::class, 'dashboard'])->name('dashboard');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/users', [SystemAdminController::class, 'storeUser'])->name('users.store');
    Route::put('/users/{user}', [SystemAdminController::class, 'updateUser'])->name('users.update');
    Route::get('/subscriptions', [SystemAdminController::class, 'subscriptions'])->name('subscriptions');
    Route::post('/subscriptions', [SystemAdminController::class, 'storeSubscription'])->name('subscriptions.store');
    Route::put('/subscriptions/{subscription}', [SystemAdminController::class, 'updateSubscription'])->name('subscriptions.update');
    Route::post('/packages', [SystemAdminController::class, 'storePackage'])->name('packages.store');
    Route::post('/subscription-plans', [SubscriptionPlanController::class, 'storePlan'])->name('plans.store');
    Route::post('/plan-requests/{planRequest}/approve', [SubscriptionPlanController::class, 'approve'])->name('plan-requests.approve');
    Route::post('/plan-requests/{planRequest}/reject', [SubscriptionPlanController::class, 'reject'])->name('plan-requests.reject');
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

    // Safety Passport rules acknowledgement + machinery: leader only (secret leader key is checked)
    Route::get('/{token}/attendance', [\App\Http\Controllers\SubconPortalController::class, 'attendance'])->name('subcon.public.attendance');
    Route::get('/{token}/attendance/history', [\App\Http\Controllers\SubconPortalController::class, 'attendanceHistory'])->name('subcon.public.attendance.history');
    Route::post('/{token}/attendance', [\App\Http\Controllers\SubconPortalController::class, 'saveAttendance'])->name('subcon.public.attendance.save');
    Route::get('/{token}/cases/{type}/{id}', [\App\Http\Controllers\SubconPortalController::class, 'showCase'])
        ->where('type', 'nc|cc')->where('id', '[0-9]+')->name('subcon.public.case.show');
    Route::post('/{token}/cases/{type}/{id}/respond', [\App\Http\Controllers\SubconPortalController::class, 'respondCase'])
        ->where('type', 'nc|cc')->name('subcon.public.case.respond');
    Route::post('/{token}/safety-passport/{topicId}', [\App\Http\Controllers\SubconPortalController::class, 'toggleInduction'])->name('subcon.public.passport.toggle');
    Route::post('/{token}/induction/{topicId}', [\App\Http\Controllers\SubconPortalController::class, 'toggleInduction']);
    Route::post('/{token}/machinery', [\App\Http\Controllers\SubconPortalController::class, 'storeMachinery'])->name('subcon.public.machinery.store');
    Route::post('/{token}/machinery/{id}', [\App\Http\Controllers\SubconPortalController::class, 'updateMachinery'])->name('subcon.public.machinery.update');
    Route::delete('/{token}/machinery/{id}', [\App\Http\Controllers\SubconPortalController::class, 'destroyMachinery'])->name('subcon.public.machinery.destroy');

    Route::get('/{token}/safety-passport/pdf', [\App\Http\Controllers\SubconPortalController::class, 'passportPdf'])->name('subcon.public.passport.pdf');
    Route::get('/{token}/staff-report', [\App\Http\Controllers\SubconPortalController::class, 'staffReport'])->name('subcon.public.staff.report');

    // Staff certification records: anyone may upload, only the leader may remove
    Route::post('/{token}/staff/{staffId}/certifications', [\App\Http\Controllers\SubconPortalController::class, 'storeCertification'])->name('subcon.public.cert.store');
    Route::delete('/{token}/staff/{staffId}/certifications/{certId}', [\App\Http\Controllers\SubconPortalController::class, 'destroyCertification'])->name('subcon.public.cert.destroy');
    Route::delete('/{token}/staff/{staffId}', [SubconPublicController::class, 'destroyStaff'])->name('subcon.public.staff.destroy');
});

Route::middleware(['auth', 'role:2,3,4,7,8'])->group(function () {
    Route::get('/plans', [SubscriptionPlanController::class, 'index'])->name('subscription.plans');
});

Route::middleware(['auth', 'role:2'])->group(function () {
    Route::get('/subscription/start', [SubscriptionPlanController::class, 'start'])->name('subscription.start');
    Route::post('/plans/request', [SubscriptionPlanController::class, 'store'])->name('subscription.plans.request');
    Route::post('/plans/inspector-addon', [SubscriptionPlanController::class, 'storeInspectorAddon'])->name('subscription.plans.inspector-addon');
    Route::get('/module', [SubscriptionController::class, 'index'])->name('index.module');
});

Route::middleware(['auth', 'role:2'])->group(function () {

    Route::get('/compliance-metrics', [ContentController::class, 'compMetrics'])
        ->name('compliance.metrics');
    // Penalty Settings were merged into Compliance Metrics - keep the old URL working
    Route::get('/penalty-settings', fn () => redirect()->route('compliance.metrics'))
        ->name('penalty.settings');


    // Performance settings > Safety Passport Rules
    Route::get('/safety-induction', fn () => redirect()->route('safety.passport'));
    Route::get('/safety-passport', [\App\Http\Controllers\SafetyInductionController::class, 'index'])->name('safety.passport');
    Route::post('/safety-passport/topics', [\App\Http\Controllers\SafetyInductionController::class, 'store'])->name('safety.passport.store');
    Route::put('/safety-passport/topics/{id}', [\App\Http\Controllers\SafetyInductionController::class, 'update'])->name('safety.passport.update');
    Route::patch('/safety-passport/topics/{id}/toggle', [\App\Http\Controllers\SafetyInductionController::class, 'toggle'])->name('safety.passport.toggle');
    Route::delete('/safety-passport/topics/{id}', [\App\Http\Controllers\SafetyInductionController::class, 'destroy'])->name('safety.passport.destroy');
    Route::post('/safety-passport/reorder', [\App\Http\Controllers\SafetyInductionController::class, 'reorder'])->name('safety.passport.reorder');


    Route::get('/manage-employee', [ContentController::class, 'manageEmployee'])->name('manage.employee');

    Route::get('/manage-project', [ContentController::class, 'manageProject'])->name('manage.project');
    Route::put('/update-project/{id}', [ProjectController::class, 'updateProject'])->name('admin.projects.update');
    Route::delete('/delete-project/{id}', [ProjectController::class, 'destroyProject'])->name('admin.projects.destroy');
    Route::post('/admin/projects', [ProjectController::class, 'storeProject'])->name('admin.projects.store');
    Route::post('/store-company', [ProjectController::class, 'storeExCompany'])->name('admin.company.store');
    Route::put('/executor-companies/{executor}', [ProjectController::class, 'update'])->name('admin.company.update');
    Route::delete('/executor-companies/{executor}', [ProjectController::class, 'destroy'])->name('admin.company.destroy');
    Route::post('/executor-staff', [ProjectController::class, 'storeExStaff'])->name('admin.staff.store');


    Route::get('/executor-project', [ContentController::class, 'executor'])
        ->name('executor');
    Route::get('/inspection', [ContentController::class, 'inspection'])
        ->name('inspection');
    Route::get('/site-visits/create', [\App\Http\Controllers\Inspector\DashboardController::class, 'createVisit'])->name('site-visits.create');
    Route::post('/site-visits', [\App\Http\Controllers\Inspector\DashboardController::class, 'storeVisit'])->name('site-visits.store');
    Route::get('/site-visits/{key}', [ContentController::class, 'visitShow'])->name('site-visits.show');
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
    Route::get('/man-hour/subcontractors/{subcon}/staff', [ManhourController::class, 'subconStaff'])
        ->name('man.hour.subcon-staff');
    Route::get('/man-hour/projects/{project}/subcontractors', [ManhourController::class, 'projectSubcontractors'])
        ->name('man.hour.project-subcontractors');
    // SPGPNC & BSPR performance: daily / monthly inspection reports, settings, explanation
    Route::get('/daily-reports', [\App\Http\Controllers\PerformanceController::class, 'index'])->name('daily.reports');
    Route::get('/monthly-reports', [\App\Http\Controllers\PerformanceController::class, 'index'])->name('monthly.reports');
    Route::get('/daily-reports/{id}', [\App\Http\Controllers\PerformanceController::class, 'dailyShow'])->where('id', '[0-9]+')->name('daily.reports.show');
    Route::get('/monthly-reports/{id}', [\App\Http\Controllers\PerformanceController::class, 'monthlyShow'])->where('id', '[0-9]+')->name('monthly.reports.show');
    Route::get('/performance/learn-more', [\App\Http\Controllers\PerformanceController::class, 'learnMore'])->name('performance.learn');
    Route::put('/performance-settings', [\App\Http\Controllers\PerformanceController::class, 'updateSettings'])->name('performance.settings');
    Route::get('/executors/{id}/staff', [ContentController::class, 'executorStaff'])
        ->name('executor.staff');
    Route::get('/executors/{id}/report', [ContentController::class, 'executorReport'])
        ->name('executor.report');
    // Toolbox Talks live inside the combined Toolbox & Inspection page (first section)
    Route::get('/toolbox-talks', fn () => redirect('/inspection#toolbox'))->name('toolbox');
    Route::get('/toolbox-talks/{id}', [ContentController::class, 'toolboxShow'])->where('id', '[0-9]+')->name('toolbox.show');

    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::put('/staff/{id}', [StaffController::class, 'update'])->name('staff.update');
    Route::delete('/staff/{id}', [StaffController::class, 'destroy'])->name('staff.destroy');

    Route::get('/list-project', [AuthController::class, 'listProject'])->name('admin.listproject');
    Route::get('/dashboard', [AuthController::class, 'index'])->name('admin.dashboard');




    Route::get('/executors/{id}/project', [ContentController::class, 'executorProjDetails'])->name('executor.project.detail');
    Route::post('/projects/{project}/add-executor', [ProjectController::class, 'addExecutor'])->name('projects.add-executor');
    Route::put('/assignments/{assignment}', [ProjectController::class, 'updateAssignment'])->name('projects.update-assignment');
    Route::delete('/assignments/{assignment}', [ProjectController::class, 'destroyAssignment'])->name('projects.remove-assignment');

    Route::post('inspections/{inspection}/verify', [InspectionController::class, 'verify'])->name('inspections.verify');
    Route::post('inspections/{inspection}/approve', [InspectionController::class, 'approve'])->name('inspections.approve');
    Route::post('inspections/{inspection}/reject', [InspectionController::class, 'reject'])->name('inspections.reject');
    Route::resource('inspections', InspectionController::class);
    Route::post('inspections/multiple', [InspectionController::class, 'storeMultiple'])->name('inspections.multiple');
    Route::delete('inspections/{inspection}/photos', [InspectionController::class, 'removePhotos'])->name('inspections.photos.remove');

    Route::post('toolbox/post', [InspectionController::class, 'storeToolbox'])->name('toolbox.store');

    Route::get('/dashboard', [InspectionController::class, 'dashboard'])
        ->name('dashboard.inspection');

    Route::post('/post-compliance-metrics', [MetricController::class, 'storeMetrics'])->name('compliance-metrics.store');
    Route::put('/compliance-metrics/{id}', [MetricController::class, 'updateMetrics'])->name('compliance-metrics.update');
    Route::delete('/compliance-metrics/{id}', [MetricController::class, 'destroyMetrics'])->name('compliance-metrics.destroy');
    Route::post('/compliance-metrics/defaults', [MetricController::class, 'loadDefaults'])->name('compliance-metrics.defaults');

    Route::post('/public/staff', [StaffController::class, 'publicStore'])->name('public.staff.store');

    Route::patch('non-conformances/{nonConformance}/status', [InspectionController::class, 'updateNonConformanceStatus']);
    Route::patch('client-complaints/{clientComplaint}/status', [InspectionController::class, 'updateClientComplaintStatus']);

    //Incident Statistics (list)
    // Route::get('/incident-statistic',[IncidentController::class, 'inciStatistic'])->name('incident.statistic');

    // Incident Create form + Store
    Route::get('/incident/create', [IncidentController::class, 'create'])->name('incident.create');
    Route::post('/incident', [IncidentController::class, 'store'])->name('incident.store');
    Route::get('/incident/project-assignments/{projectId}', [IncidentController::class, 'getProjectAssignments']);
    Route::get('/incident/subcon-staff/{subconId}', [IncidentController::class, 'subconStaff']);

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



// Supervisor (4) and Manager (3) review portal: verify / approve inspections, answer NC / CC cases
Route::middleware(['auth', 'role:3,4'])->prefix('review')->name('review.')->group(function () {
    $c = \App\Http\Controllers\ReviewController::class;
    Route::get('/dashboard', [$c, 'dashboard'])->name('dashboard');
    Route::get('/inspections', [$c, 'inspectionsIndex'])->name('inspections');
    Route::get('/cases', [$c, 'casesIndex'])->name('cases');
    Route::get('/toolbox', [$c, 'toolboxIndex'])->name('toolbox');
    Route::get('/visits', [$c, 'visitsIndex'])->name('visits');
    Route::get('/projects', [$c, 'projectsIndex'])->name('projects');
    Route::get('/projects/{id}', [$c, 'projectShow'])->where('id', '[0-9]+')->name('projects.show');
    Route::get('/subcons', [$c, 'subconsIndex'])->name('subcons');
    Route::get('/subcons/{id}', [$c, 'subconShow'])->where('id', '[0-9]+')->name('subcons.show');

    // performance reports (Supervisor verifies, Manager approves and reviews penalties)
    Route::get('/reports', [\App\Http\Controllers\PerformanceController::class, 'index'])->name('reports');
    Route::get('/reports/daily/{id}', [\App\Http\Controllers\PerformanceController::class, 'dailyShow'])->where('id', '[0-9]+')->name('reports.daily');
    Route::get('/reports/monthly/{id}', [\App\Http\Controllers\PerformanceController::class, 'monthlyShow'])->where('id', '[0-9]+')->name('reports.monthly');
    Route::post('/reports/daily/{id}/penalty', [\App\Http\Controllers\PerformanceController::class, 'penaltyReview'])->name('reports.penalty');
    Route::post('/reports/monthly/{id}/verify', [\App\Http\Controllers\PerformanceController::class, 'monthlyVerify'])->name('reports.monthly.verify');
    Route::post('/reports/monthly/{id}/approve', [\App\Http\Controllers\PerformanceController::class, 'monthlyApprove'])->name('reports.monthly.approve');
    Route::post('/reports/monthly/{id}/reject', [\App\Http\Controllers\PerformanceController::class, 'monthlyReject'])->name('reports.monthly.reject');
    Route::get('/performance', [\App\Http\Controllers\PerformanceController::class, 'learnMore'])->name('performance');
    Route::get('/staff-approval', [\App\Http\Controllers\StaffApprovalController::class, 'index'])->name('staff-approval');
    Route::get('/staff-approval/{id}', [\App\Http\Controllers\StaffApprovalController::class, 'show'])->where('id', '[0-9]+')->name('staff-approval.show');
    Route::post('/staff-approval/approve-many', [\App\Http\Controllers\StaffApprovalController::class, 'approveMany'])->name('staff-approval.approve-many');
    Route::post('/staff-approval/{id}/approve', [\App\Http\Controllers\StaffApprovalController::class, 'approve'])->name('staff-approval.approve');
    Route::get('/incidents', [$c, 'incidentsIndex'])->name('incidents');
    Route::get('/incidents/{id}', [$c, 'incidentShow'])->where('id', '[0-9]+')->name('incidents.show');
    Route::post('/incidents/{id}/respond', [$c, 'incidentRespond'])->name('incidents.respond');
    Route::post('/incidents/{id}/close', [$c, 'incidentClose'])->name('incidents.close');
    Route::post('/incidents/{id}/reopen', [$c, 'incidentReopen'])->name('incidents.reopen');
    Route::get('/visits/{key}', [$c, 'visitShow'])->where('key', '(talk|insp)-[0-9]+')->name('visits.show');
    Route::get('/cases/{type}/{id}', [$c, 'caseShow'])->where('type', 'nc|cc')->where('id', '[0-9]+')->name('cases.show');
    Route::get('/inspections/{id}', [$c, 'inspectionShow'])->where('id', '[0-9]+')->name('inspections.show');
    Route::post('/visits/{id}/verify', [$c, 'visitVerify'])->name('visits.verify');
    Route::post('/visits/{id}/approve', [$c, 'visitApprove'])->name('visits.approve');
    Route::post('/visits/{id}/reject', [$c, 'visitReject'])->name('visits.reject');
    Route::post('/inspections/{inspection}/verify', [InspectionController::class, 'verify'])->name('inspections.verify');
    Route::post('/inspections/{inspection}/approve', [InspectionController::class, 'approve'])->name('inspections.approve');
    Route::post('/inspections/{inspection}/reject', [InspectionController::class, 'reject'])->name('inspections.reject');
    Route::post('/cases/{type}/{id}/close', [$c, 'closeCase'])->where('type', 'nc|cc')->name('cases.close');
    Route::post('/cases/{type}/{id}/return', [$c, 'returnCase'])->where('type', 'nc|cc')->name('cases.return');
});

Route::middleware(['auth', 'role:7,8'])->prefix('inspector')->name('inspector.')->group(function () {
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
    // Inspections always start from the site visit flow (toolbox talk first, can be skipped)
    Route::get('/visits', [DashboardController::class, 'visits'])->name('visits');
    Route::get('/visits/create', [DashboardController::class, 'createVisit'])->name('visits.create');
    Route::post('/visits', [DashboardController::class, 'storeVisit'])->name('visits.store');
    Route::get('/visits/{key}', [DashboardController::class, 'showVisit'])->where('key', '(talk|insp)-[0-9]+')->name('visits.show');
    Route::get('/inspections/create', fn () => redirect()->route('inspector.visits.create'))->name('inspections.create');

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

    // Report incident (same form as the admin) + daily attendance viewer
    Route::get('/incidents', [IncidentController::class, 'inspectorIndex'])->name('incidents');
    Route::get('/incidents/create', [IncidentController::class, 'create'])->name('incident.create');
    Route::post('/incidents', [IncidentController::class, 'store'])->name('incident.store');
    Route::get('/incidents/project-assignments/{projectId}', [IncidentController::class, 'getProjectAssignments']);
    Route::get('/incidents/subcon-staff/{subconId}', [IncidentController::class, 'subconStaff']);
    Route::get('/attendance', [DashboardController::class, 'attendance'])->name('attendance');

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

// PDF reports (company admin 2, manager 3, supervisor 4, inspectors 7/8) - scoped to the user's company
Route::middleware(['auth', 'role:2,3,4,7,8'])->prefix('pdf')->name('pdf.')->group(function () {
    $c = \App\Http\Controllers\PdfReportController::class;
    Route::get('/inspection/{id}', [$c, 'inspection'])->where('id', '[0-9]+')->name('inspection');
    Route::get('/toolbox/{id}', [$c, 'toolbox'])->where('id', '[0-9]+')->name('toolbox');
    Route::get('/visit/{key}', [$c, 'visit'])->where('key', '(talk|insp)-[0-9]+')->name('visit');
    Route::get('/case/{type}/{id}', [$c, 'caseReport'])->where('type', 'nc|cc')->where('id', '[0-9]+')->name('case');
    Route::get('/attendance', [$c, 'attendance'])->name('attendance');
    Route::get('/manhour', [$c, 'manhour'])->name('manhour');
    Route::get('/incident/{id}', [$c, 'incident'])->where('id', '[0-9]+')->name('incident');
    Route::get('/daily/{id}', [$c, 'daily'])->where('id', '[0-9]+')->name('daily');
    Route::get('/monthly/{id}', [$c, 'monthly'])->where('id', '[0-9]+')->name('monthly');
});

// Company profile (company account only)
Route::middleware(['auth', 'role:2'])->group(function () {
    Route::get('/company-details', [\App\Http\Controllers\CompanyDetailsController::class, 'show'])->name('company.details');
    Route::put('/company-details', [\App\Http\Controllers\CompanyDetailsController::class, 'update'])->name('company.details.update');
});

