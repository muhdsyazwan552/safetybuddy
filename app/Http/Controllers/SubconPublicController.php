<?php


namespace App\Http\Controllers;

use App\Models\SubconCompany;
use App\Models\SubconStaff;
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
        $company = SubconCompany::where('public_token', $token)
            ->with('subconStaff')
            ->firstOrFail();

        // Leader access needs the secret leader key – never just the staff token
        if ($role === 'leader' && !$company->isValidLeaderKey($key)) {
            return redirect()->route('subcon.public.staff', ['token' => $token])
                ->with('warning', 'That leader link is not valid. You are viewing the staff page.');
        }

        $accessLevel = $role === 'leader' ? 'full' : 'limited';

        return Inertia::render('SubconPublic/CompanyDetails', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'contact' => $company->contact,
                'address' => $company->address,
                'short_name' => $company->short_name,
                'status' => $company->status,
            ],
            'staffs' => $company->subconStaff,
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