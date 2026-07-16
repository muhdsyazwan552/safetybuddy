<?php

namespace App\Http\Controllers;

use App\Models\CompanyStaff;
use App\Models\Manhour;
use App\Models\Project;
use App\Models\SubconCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ManhourController extends Controller
{
    public function store(Request $request)
    {
        $staff = CompanyStaff::where('user_id', Auth::id())->firstOrFail();

        $validated = $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'subcon_company_id' => ['required', 'integer', 'exists:subcon_company,id'],
            'work_date' => ['required', 'date'],
            'worker_count' => ['required', 'integer', 'min:0', 'max:100000'],
            'working_hours' => ['required', 'numeric', 'min:0', 'max:24'],
        ]);

        $project = Project::where('id', $validated['project_id'])
            ->where('company_id', $staff->company_id)
            ->firstOrFail();

        $isAssigned = DB::table('project_assign')
            ->where('project_id', $project->id)
            ->where('entity_type', 'compsub')
            ->where('entity_id', $validated['subcon_company_id'])
            ->exists();

        abort_unless($isAssigned, 422, 'The selected subcontractor is not assigned to this project.');

        Manhour::updateOrCreate(
            [
                'project_id' => $project->id,
                'subcon_company_id' => $validated['subcon_company_id'],
                'work_date' => $validated['work_date'],
            ],
            [
                'company_id' => $staff->company_id,
                'worker_count' => $validated['worker_count'],
                'working_hours' => $validated['working_hours'],
            ]
        );

        return redirect()->route('man.hour')->with('success', 'Daily manhour entry saved.');
    }

    public function projectSubcontractors(Project $project)
    {
        $staff = CompanyStaff::where('user_id', Auth::id())->firstOrFail();
        abort_unless((int) $project->company_id === (int) $staff->company_id, 403);

        $companyIds = DB::table('project_assign')
            ->where('project_id', $project->id)
            ->where('entity_type', 'compsub')
            ->pluck('entity_id');

        return response()->json([
            'subcontractors' => SubconCompany::whereIn('id', $companyIds)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
