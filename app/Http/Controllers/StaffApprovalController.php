<?php

namespace App\Http\Controllers;

use App\Models\CompanyStaff;
use App\Models\SubconStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/** New subcon staff stay Pending until BOTH the Supervisor (role 4) and the Manager (role 3) approve. */
class StaffApprovalController extends Controller
{
    private function query()
    {
        $companyId = Auth::user()->company_id;

        return SubconStaff::with('subconCompany:id,name,code')
            ->whereHas('subconCompany', fn ($q) => $q->where('company_id', $companyId));
    }

    public function index()
    {
        $isManager = (int) Auth::user()->role_id === 3;

        $rows = $this->query()->where('status', 'pending')->orderBy('created_at')->get()
            ->map(fn (SubconStaff $s) => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'role' => $s->role,
                'email' => $s->email,
                'contact' => $s->contact,
                'company' => $s->subconCompany?->name,
                'is_safetypassport' => $s->is_safetypassport,
                'supervisor_approved_at' => optional($s->supervisor_approved_at)->format('Y-m-d H:i'),
                'manager_approved_at' => optional($s->manager_approved_at)->format('Y-m-d H:i'),
                'registered_at' => optional($s->created_at)->format('Y-m-d H:i'),
                'can_approve' => $s->is_safetypassport && !($isManager ? $s->manager_approved_at : $s->supervisor_approved_at),
            ])->values();

        return Inertia::render('Review/StaffApproval', [
            'staff' => $rows,
            'myRole' => $isManager ? 'manager' : 'supervisor',
        ]);
    }

    /** One worker with everything: details, Safety Passport, approvals, certifications. */
    public function show(int $id)
    {
        $s = $this->query()->with('certifications')->findOrFail($id);
        $company = $s->subconCompany()->first();
        $isManager = (int) Auth::user()->role_id === 3;

        $names = CompanyStaff::whereIn('id', array_filter([$s->supervisor_approved_by, $s->manager_approved_by]))->pluck('name', 'id');
        $ackedAt = \Illuminate\Support\Facades\DB::table('subcon_induction_acks')->where('subcon_company_id', $company->id)->pluck('acknowledged_at', 'topic_id');

        $topics = \App\Support\SubconCompliance::topicsFor($company)->map(fn ($t) => [
            'id' => $t->id,
            'title' => $t->title,
            'acknowledged_at' => isset($ackedAt[$t->id]) ? \Carbon\Carbon::parse($ackedAt[$t->id])->format('Y-m-d H:i') : null,
            'items' => $t->items->map(fn ($i) => ['type' => $i->type, 'content' => $i->content])->values(),
        ])->values();

        return Inertia::render('Review/StaffApprovalShow', [
            'staff' => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'role' => $s->role,
                'email' => $s->email,
                'contact' => $s->contact,
                'status' => $s->status,
                'company' => $company->name,
                'company_code' => $company->code,
                'is_safetypassport' => $s->is_safetypassport,
                'supervisor_approved_at' => optional($s->supervisor_approved_at)->format('Y-m-d H:i'),
                'supervisor_approved_name' => $names[$s->supervisor_approved_by] ?? null,
                'manager_approved_at' => optional($s->manager_approved_at)->format('Y-m-d H:i'),
                'manager_approved_name' => $names[$s->manager_approved_by] ?? null,
                'registered_at' => optional($s->created_at)->format('Y-m-d H:i'),
                'can_approve' => $s->status === 'pending' && $s->is_safetypassport && !($isManager ? $s->manager_approved_at : $s->supervisor_approved_at),
                'certifications' => $s->certifications->map(fn ($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'expiry_date' => optional($c->expiry_date)->format('Y-m-d'),
                    'file_url' => \Illuminate\Support\Facades\Storage::url($c->file),
                ])->values(),
            ],
            'topics' => $topics,
            'myRole' => $isManager ? 'manager' : 'supervisor',
        ]);
    }

    /** Record my approval (Manager or Supervisor) on one worker; false when there is nothing to do. */
    private function approveOne(SubconStaff $staff): bool
    {
        $manager = (int) Auth::user()->role_id === 3;
        if (!$staff->is_safetypassport || $staff->status !== 'pending' || ($manager ? $staff->manager_approved_at : $staff->supervisor_approved_at)) {
            return false;
        }

        $by = CompanyStaff::where('user_id', Auth::id())->value('id');
        $staff->forceFill($manager
            ? ['manager_approved_by' => $by, 'manager_approved_at' => now()]
            : ['supervisor_approved_by' => $by, 'supervisor_approved_at' => now()]
        )->save();
        $staff->activateIfFullyApproved();

        return true;
    }

    public function approve(int $id)
    {
        $staff = $this->query()->where('status', 'pending')->findOrFail($id);
        abort_unless($staff->is_safetypassport, 422, 'Safety Passport is not confirmed for this worker.');

        $this->approveOne($staff);

        return back()->with('success', $staff->status === 'active'
            ? "{$staff->name} is now Active."
            : 'Approved. Waiting for the other approver.');
    }

    /** Approve the selected workers in one go. */
    public function approveMany(Request $request)
    {
        $data = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer']);

        $done = 0;
        foreach ($this->query()->where('status', 'pending')->whereIn('id', $data['ids'])->get() as $staff) {
            $done += $this->approveOne($staff) ? 1 : 0;
        }

        return back()->with('success', $done ? "{$done} staff approved." : 'Nothing to approve in the selection.');
    }
}
