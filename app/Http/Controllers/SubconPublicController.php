<?php


namespace App\Http\Controllers;

use App\Models\SubconCompany;
use App\Models\SubconStaff;
use App\Models\SubconMachinery;
use App\Support\SubconCompliance;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SubconPublicController extends Controller
{
    /**
     * Show the public company page with role-based access
     */
    public function show(Request $request, $token)
    {
        // read by name – route parameters are passed to the action by position
        $role = $request->route('role', 'staff');
        $key = $request->route('key');

        // Find company by public token
        $company = SubconCompany::where('public_token', $token)->firstOrFail();

        // Leader access needs the secret leader key – never just the staff token
        if ($role === 'leader' && !$company->isValidLeaderKey($key)) {
            return redirect()->route('subcon.public.staff', ['token' => $token])
                ->with('warning', 'That leader link is not valid. You are viewing the staff page.');
        }

        $accessLevel = $role === 'leader' ? 'full' : 'limited';

        // Active only while every safety-induction topic is acknowledged
        $progress = SubconCompliance::sync($company);
        $company->refresh();

        $topics = SubconCompliance::topicsFor($company)->map(fn ($t) => [
            'id' => $t->id,
            'title' => $t->title,
            'acked' => in_array((int) $t->id, $progress['acked'], true),
            'items' => $t->items->map(fn ($i) => ['type' => $i->type, 'content' => $i->content])->values(),
        ])->values();

        $staffs = SubconStaff::with('certifications')
            ->where('company_id', $company->id)
            ->orderBy('id')
            ->get()
            ->map(function ($s) {
                $row = $s->toArray();
                $row['certifications'] = $s->certifications->map(fn ($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'expiry_date' => optional($c->expiry_date)->format('Y-m-d'),
                    'file_url' => Storage::url($c->file),
                    'original_name' => $c->original_name,
                    'uploaded_at' => optional($c->created_at)->format('Y-m-d'),
                ])->values();

                return $row;
            });

        $operators = $staffs->pluck('name', 'id');

        $machinery = SubconMachinery::where('subcon_company_id', $company->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'identifier' => $m->identifier,
                'cf_attached' => (bool) $m->cf_file,
                'cf_url' => $m->cf_file ? Storage::url($m->cf_file) : null,
                'cf_expiry' => optional($m->cf_expiry)->format('Y-m-d'),
                'operator_id' => $m->operator_id,
                'operator_name' => $operators[$m->operator_id] ?? null,
            ])->values();

        // NC / CC raised against this company - only the leader sees and answers them
        $cases = $role === 'leader'
            ? \App\Support\CaseFeed::collect(fn ($q) => $q->whereHas('inspection', fn ($i) => $i->where('subcon_company_id', $company->id)))
            : collect();

        // projects this company is assigned to - the leader ticks attendance per project and day
        $attendanceProjects = $role === 'leader'
            ? \App\Models\Project::whereIn('id', \Illuminate\Support\Facades\DB::table('project_assign')
                ->where('entity_type', 'compsub')->where('entity_id', $company->id)->pluck('project_id'))
                ->orderBy('name')->get(['id', 'name'])
            : collect();

        // latest performance of this contractor (leader only)
        $performance = null;
        if ($role === 'leader') {
            \App\Support\ReportBuilder::refreshDaily($company->company_id, $company->id);
            $daily = \App\Models\InspectionReport::where('subcon_company_id', $company->id)
                ->orderByDesc('report_date')->limit(5)->get();
            $names = \App\Models\Project::whereIn('id', $daily->pluck('project_id'))->pluck('name', 'id');
            $monthly = \App\Models\MonthlyReport::where('subcon_company_id', $company->id)
                ->where('status', 'approved')->orderByDesc('period')->first();

            $performance = [
                'daily' => $daily->map(fn ($d) => [
                    'id' => $d->id, 'date' => $d->report_date->format('Y-m-d'), 'project' => $names[$d->project_id] ?? '-',
                    'spgpnc' => $d->spgpnc, 'rank' => $d->rank, 'penalty' => (float) $d->penalty_total, 'status' => $d->status,
                    'penalty_status' => $d->penalty_status,
                ])->values(),
                'monthly' => $monthly ? [
                    'period' => $monthly->period, 'spgpnc' => $monthly->spgpnc, 'rank' => $monthly->rank,
                    'penalty' => (float) $monthly->penalty_total,
                ] : null,
            ];
        }

        return Inertia::render('SubconPublic/CompanyDetails', [
            'cases' => $cases,
            'performance' => $performance,
            'attendance_projects' => $attendanceProjects,
            'hours_per_worker' => \App\Support\ManhourAttendance::HOURS_PER_WORKER,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'contact' => $company->contact,
                'address' => $company->address,
                'short_name' => $company->short_name,
                'status' => $company->status,
            ],
            'staffs' => $staffs,
            'induction' => [
                'topics' => $topics,
                'total' => $progress['total'],
                'done' => $progress['done'],
                'complete' => $progress['complete'],
            ],
            'machinery' => $machinery,
            'public_token' => $token,
            'leader_key' => $role === 'leader' ? $key : null,
            'access_level' => $accessLevel,
            'role' => $role,
        ]);
    }

    /**
     * Staff members may add colleagues, but only a leader may edit / remove.
     */
    private function leaderCompany(Request $request, $token): SubconCompany
    {
        $company = SubconCompany::where('public_token', $token)->firstOrFail();

        abort_unless(
            $company->isValidLeaderKey($request->input('leader_key')),
            403,
            'Only the company leader can do this.'
        );

        return $company;
    }

    /**
     * Store new staff member (accessible by both roles)
     */
    public function storeStaff(Request $request, $token)
    {
        $company = SubconCompany::where('public_token', $token)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:subcon_staff,email',
            'contact' => 'nullable|string|max:20',
            'role' => 'nullable|string|max:100',
        ]);

        // Generate a temporary password
        $tempPassword = Str::random(10);

        $staff = SubconStaff::create([
            'company_id' => $company->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'contact' => $validated['contact'] ?? null,
            'role' => $validated['role'] ?? 'Staff',
            'status' => 'active',
            'temp_password' => Hash::make($tempPassword),
        ]);

        // You can send email with temporary password here
        // Mail::to($staff->email)->send(new StaffInvitation($staff, $tempPassword));

        return redirect()->back()->with('success', 'Staff member added successfully!');
    }

    /**
     * Update staff member (leader only)
     */
    public function updateStaff(Request $request, $token, $staffId)
    {
        $company = $this->leaderCompany($request, $token);
        $staff = SubconStaff::where('company_id', $company->id)
            ->where('id', $staffId)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:subcon_staff,email,' . $staff->id,
            'contact' => 'nullable|string|max:20',
            'role' => 'nullable|string|max:100',
            'status' => 'sometimes|in:active,inactive',
            'leader_key' => 'required|string',
        ]);

        unset($validated['leader_key']);
        $staff->update($validated);

        return redirect()->back()->with('success', 'Staff member updated successfully!');
    }

    /**
     * Delete staff member (leader only)
     */
    public function destroyStaff(Request $request, $token, $staffId)
    {
        $company = $this->leaderCompany($request, $token);
        $staff = SubconStaff::where('company_id', $company->id)
            ->where('id', $staffId)
            ->firstOrFail();

        $staff->delete();

        return redirect()->back()->with('success', 'Staff member removed successfully!');
    }
}