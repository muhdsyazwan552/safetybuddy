<?php

namespace App\Http\Controllers;

use App\Models\CompanyStaff;
use App\Models\Manhour;
use App\Models\Project;
use App\Models\SubconCompany;
use App\Support\ManhourAttendance;
use App\Models\SubconStaff;
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
            'staff_ids' => ['required', 'array', 'min:1'],
            'staff_ids.*' => ['integer'],
        ], ['staff_ids.required' => 'Select at least one subcontractor staff.', 'staff_ids.min' => 'Select at least one subcontractor staff.']);

        $project = Project::where('id', $validated['project_id'])
            ->where('company_id', $staff->company_id)
            ->firstOrFail();

        abort_unless(
            ManhourAttendance::isAssigned($project->id, (int) $validated['subcon_company_id']),
            422,
            'The selected subcontractor is not assigned to this project.'
        );

        // working hours are fixed (8h per ticked worker) - the total is calculated by the system
        ManhourAttendance::save($project, (int) $validated['subcon_company_id'], $validated['work_date'], $validated['staff_ids']);

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

    /** Staff of a subcontractor, with the ones already ticked for the chosen project / day. */
    public function subconStaff(Request $request, SubconCompany $subcon)
    {
        $me = CompanyStaff::where('user_id', Auth::id())->firstOrFail();
        $project = Project::where('id', $request->query('project_id'))->where('company_id', $me->company_id)->firstOrFail();
        abort_unless(ManhourAttendance::isAssigned($project->id, $subcon->id), 403);

        $date = $request->query('date', now()->toDateString());

        return response()->json([
            'staff' => SubconStaff::where('company_id', $subcon->id)->orderBy('name')->get(['id', 'name', 'role']),
            'ticked' => ManhourAttendance::ticked($project->id, $subcon->id, $date),
        ]);
    }
}
