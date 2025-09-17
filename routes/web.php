<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\InspectionController;
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

Route::get('/', [AuthController::class, 'login'])->name('admin.login');

Route::get('/compliance-metrics', [ContentController::class, 'compMetrics'])
    ->name('compliance.metrics');
Route::get('/penalty-settings', [ContentController::class, 'penalSetting'])
    ->name('penalty.settings');


Route::get('/manage-employee', [ContentController::class, 'manageEmployee'])->name('manage.employee');

Route::get('/manage-project', [ContentController::class, 'manageProject'])->name('manage.project');
Route::put('/update-project/{id}', [ProjectController::class, 'updateProject'])->name('admin.projects.update');
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
Route::get('/daily-reports', [ContentController::class, 'dailyReports'])
    ->name('daily.reports');
Route::get('/monthly-reports', [ContentController::class, 'monthlyReports'])
    ->name('monthly.reports');
Route::get('/executors/{id}/staff', [ContentController::class, 'executorStaff'])
    ->name('executor.staff');
Route::get('/toolbox-talks', [ContentController::class, 'toolbox'])->name('toolbox');




Route::get('/login-view', [AuthController::class, 'login'])->name('login.view');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login');

Route::get('/register-view', [AuthController::class, 'register'])->name('admin.register');
Route::post('/register', [AuthController::class, 'store']);

Route::middleware(['auth'])->post('/staff', [StaffController::class, 'store'])->name('staff.store');

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

