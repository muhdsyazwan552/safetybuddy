<?php

namespace App\Http\Controllers;

use App\Models\SubconCompany;
use App\Models\SubconMachinery;
use App\Models\SubconStaff;
use App\Models\SubconStaffCertification;
use App\Support\SubconCompliance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Public subcontractor portal – Safety Passport rules, machinery and staff certifications.
 *  - induction + machinery: company LEADER only (secret leader key)
 *  - certification upload: any staff of the company
 *  - certification removal: leader only
 */
class SubconPortalController extends Controller
{
    private function company(string $token): SubconCompany
    {
        return SubconCompany::where('public_token', $token)->firstOrFail();
    }

    private function leaderCompany(Request $request, string $token): SubconCompany
    {
        $company = $this->company($token);

        abort_unless(
            $company->isValidLeaderKey($request->input('leader_key')),
            403,
            'Only the company leader can do this.'
        );

        return $company;
    }

    private function fileRules(): array
    {
        return ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'];
    }

    // ------------------------------------------------------------------ daily attendance

    /** Staff already ticked for a project and day (leader only, key in the query string). */
    public function attendance(Request $request, string $token)
    {
        $company = $this->company($token);
        abort_unless($company->isValidLeaderKey($request->query('leader_key')), 403);

        $projectId = (int) $request->query('project_id');
        abort_unless(\App\Support\ManhourAttendance::isAssigned($projectId, $company->id), 404);

        return response()->json([
            'ticked' => \App\Support\ManhourAttendance::ticked($projectId, $company->id, $request->query('date', now()->toDateString())),
        ]);
    }

    /** Previous days of the company on a project: who was ticked present (leader only). */
    public function attendanceHistory(Request $request, string $token)
    {
        $company = $this->company($token);
        abort_unless($company->isValidLeaderKey($request->query('leader_key')), 403);

        $projectId = (int) $request->query('project_id');
        abort_unless(\App\Support\ManhourAttendance::isAssigned($projectId, $company->id), 404);

        $staff = DB::table('manhour_attendances as a')
            ->join('subcon_staff as s', 's.id', '=', 'a.subcon_staff_id')
            ->where('a.project_id', $projectId)->where('a.subcon_company_id', $company->id)
            ->orderBy('s.name')
            ->get(['a.work_date', 's.id', 's.name', 's.role'])
            ->groupBy(fn ($r) => substr((string) $r->work_date, 0, 10));

        // older records that only have a headcount
        $days = DB::table('manhours')->where('project_id', $projectId)->where('subcon_company_id', $company->id)
            ->orderByDesc('work_date')->limit(120)->get(['work_date', 'worker_count', 'working_hours'])
            ->map(function ($m) use ($staff) {
                $date = substr((string) $m->work_date, 0, 10);
                $names = $staff->get($date, collect());

                return [
                    'date' => $date,
                    'workers' => (int) $m->worker_count,
                    'hours' => (float) $m->working_hours,
                    'manhours' => round($m->worker_count * (float) $m->working_hours, 2),
                    'staff' => $names->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'role' => $r->role])->values(),
                ];
            })->values();

        return response()->json(['days' => $days]);
    }

    /** The leader ticks which staff worked that day; hours are fixed by the system. */
    public function saveAttendance(Request $request, string $token): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $data = $request->validate([
            'project_id' => 'required|integer',
            'work_date' => 'required|date|before_or_equal:today',
            'staff_ids' => 'present|array',
            'staff_ids.*' => 'integer',
        ]);

        abort_unless(\App\Support\ManhourAttendance::isAssigned((int) $data['project_id'], $company->id), 404);
        $project = \App\Models\Project::findOrFail($data['project_id']);

        $n = \App\Support\ManhourAttendance::save($project, $company->id, $data['work_date'], $data['staff_ids']);

        return back()->with('success', "Attendance saved: {$n} worker(s) = " . ($n * \App\Support\ManhourAttendance::HOURS_PER_WORKER) . ' manhours.');
    }

    // ------------------------------------------------------------------ NC / CC cases

    /** The leader gives the reason / corrective action for a case raised against the company. */
    /** Leader only: one NC / CC case on its own page, with the reply box. */
    public function showCase(Request $request, string $token, string $type, int $id)
    {
        $company = $this->leaderCompany($request, $token);

        $case = \App\Support\CaseFeed::model($type)::with(\App\Support\CaseFeed::WITH)->findOrFail($id);
        abort_unless((int) optional($case->inspection)->subcon_company_id === (int) $company->id, 404);

        return \Inertia\Inertia::render('SubconPublic/CaseDetail', [
            'company' => ['name' => $company->name, 'code' => $company->code],
            'item' => \App\Support\CaseFeed::row($type, $case),
            'public_token' => $token,
            'leader_key' => $request->query('leader_key'),
        ]);
    }

    public function respondCase(Request $request, string $token, string $type, int $id): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $data = $request->validate(['response' => 'required|string|min:5|max:2000']);

        $case = \App\Support\CaseFeed::model($type)::with('inspection')->findOrFail($id);
        abort_unless((int) optional($case->inspection)->subcon_company_id === (int) $company->id, 404);
        abort_if($case->status === 'closed', 422, 'This case is already closed.');

        $case->update([
            'subcon_response' => $data['response'],
            'responded_at' => now(),
            'responded_by' => $company->name . ' (Leader)',
            'return_reason' => null,
        ]);

        return back()->with('success', 'Your response was sent for review.');
    }

    // ------------------------------------------------------------------ Safety Passport

    public function toggleInduction(Request $request, string $token, int $topicId): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);

        $topic = SubconCompliance::topicsFor($company)->firstWhere('id', $topicId);
        abort_unless($topic, 404);

        $ack = (bool) $request->boolean('acknowledged', true);

        if ($ack) {
            DB::table('subcon_induction_acks')->updateOrInsert(
                ['subcon_company_id' => $company->id, 'topic_id' => $topic->id],
                ['acknowledged_at' => now(), 'updated_at' => now(), 'created_at' => now()]
            );
        } else {
            DB::table('subcon_induction_acks')
                ->where('subcon_company_id', $company->id)
                ->where('topic_id', $topic->id)
                ->delete();
        }

        $progress = SubconCompliance::sync($company);

        return back()->with(
            $progress['complete'] ? 'success' : 'info',
            $progress['complete']
                ? 'All Safety Passport rules are acknowledged. The company is ACTIVE.'
                : "Safety Passport {$progress['done']}/{$progress['total']} – tick every rule to continue."
        );
    }


    // ------------------------------------------------------------------ machinery

    private function machineryRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'identifier' => ['nullable', 'string', 'max:100'],
            'cf_expiry' => ['nullable', 'date'],
            'operator_id' => ['nullable', 'integer'],
            'cf_file' => array_merge(['nullable'], $this->fileRules()),
        ];
    }

    private function operatorFor(SubconCompany $company, $operatorId): ?int
    {
        if (!$operatorId) {
            return null;
        }

        return SubconStaff::where('company_id', $company->id)->where('id', $operatorId)->value('id');
    }

    public function storeMachinery(Request $request, string $token): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $data = $request->validate($this->machineryRules());

        SubconMachinery::create([
            'subcon_company_id' => $company->id,
            'name' => trim($data['name']),
            'identifier' => $data['identifier'] ?? null,
            'cf_expiry' => $data['cf_expiry'] ?? null,
            'operator_id' => $this->operatorFor($company, $data['operator_id'] ?? null),
            'cf_file' => $request->hasFile('cf_file')
                ? $request->file('cf_file')->store("subcon/{$company->id}/machinery", 'public')
                : null,
        ]);

        return back()->with('success', 'Machinery added.');
    }

    public function updateMachinery(Request $request, string $token, int $id): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $machine = SubconMachinery::where('subcon_company_id', $company->id)->findOrFail($id);
        $data = $request->validate($this->machineryRules());

        $update = [
            'name' => trim($data['name']),
            'identifier' => $data['identifier'] ?? null,
            'cf_expiry' => $data['cf_expiry'] ?? null,
            'operator_id' => $this->operatorFor($company, $data['operator_id'] ?? null),
        ];

        if ($request->hasFile('cf_file')) {
            if ($machine->cf_file) {
                Storage::disk('public')->delete($machine->cf_file);
            }
            $update['cf_file'] = $request->file('cf_file')->store("subcon/{$company->id}/machinery", 'public');
        } elseif ($request->boolean('remove_cf_file') && $machine->cf_file) {
            Storage::disk('public')->delete($machine->cf_file);
            $update['cf_file'] = null;
        }

        $machine->update($update);

        return back()->with('success', 'Machinery updated.');
    }

    public function destroyMachinery(Request $request, string $token, int $id): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $machine = SubconMachinery::where('subcon_company_id', $company->id)->findOrFail($id);

        if ($machine->cf_file) {
            Storage::disk('public')->delete($machine->cf_file);
        }
        $machine->delete();

        return back()->with('success', 'Machinery removed.');
    }

    // ------------------------------------------------------------------ Safety Passport reference PDF

    /** Any staff or the leader: every Safety Passport rule with its full content, for reference. */
    public function passportPdf(string $token)
    {
        $company = $this->company($token);

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.safety_passport', [
            'company' => $company,
            'topics' => SubconCompliance::topicsFor($company),
            'generatedAt' => now()->format('d M Y H:i'),
        ])->setPaper('a4', 'portrait')->stream('safety-passport.pdf');
    }

    // ------------------------------------------------------------------ staff PDF report

    /** Leader only: PDF list of the staff, all or active only. */
    public function staffReport(Request $request, string $token)
    {
        $company = $this->leaderCompany($request, $token);
        $filter = $request->query('filter') === 'active' ? 'active' : 'all';

        $staff = SubconStaff::where('company_id', $company->id)
            ->when($filter === 'active', fn ($q) => $q->where('status', 'active'))
            ->orderBy('serial_no')->orderBy('id')->get();

        $approvers = \App\Models\CompanyStaff::whereIn('id', $staff->pluck('supervisor_approved_by')->merge($staff->pluck('manager_approved_by'))->filter()->unique())
            ->pluck('name', 'id');

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.subcon_staff', [
            'company' => $company,
            'staff' => $staff,
            'approvers' => $approvers,
            'filter' => $filter,
            'generatedAt' => now()->format('d M Y H:i'),
        ])->setPaper('a4', 'landscape')->stream('staff-' . $filter . '-' . ($company->code ? str_replace('/', '-', $company->code) : $company->id) . '.pdf');
    }

    // ------------------------------------------------------------------ staff certifications

    private function staffOf(SubconCompany $company, int $staffId): SubconStaff
    {
        return SubconStaff::where('company_id', $company->id)->findOrFail($staffId);
    }

    public function storeCertification(Request $request, string $token, int $staffId): RedirectResponse
    {
        $company = $this->company($token);
        $staff = $this->staffOf($company, $staffId);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'expiry_date' => ['nullable', 'date'],
            'file' => array_merge(['required'], $this->fileRules()),
        ]);

        $file = $request->file('file');

        SubconStaffCertification::create([
            'subcon_staff_id' => $staff->id,
            'title' => trim($data['title']),
            'expiry_date' => $data['expiry_date'] ?? null,
            'file' => $file->store("subcon/{$company->id}/certifications", 'public'),
            'original_name' => $file->getClientOriginalName(),
        ]);

        return back()->with('success', "Certification uploaded for {$staff->name}.");
    }

    public function destroyCertification(Request $request, string $token, int $staffId, int $certId): RedirectResponse
    {
        $company = $this->leaderCompany($request, $token);
        $staff = $this->staffOf($company, $staffId);

        $cert = SubconStaffCertification::where('subcon_staff_id', $staff->id)->findOrFail($certId);
        Storage::disk('public')->delete($cert->file);
        $cert->delete();

        return back()->with('success', 'Certification removed.');
    }
}
