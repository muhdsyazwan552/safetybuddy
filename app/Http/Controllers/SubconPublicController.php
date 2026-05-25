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
    public function show($token, $role = 'staff')
    {
        // Find company by public token
        $company = SubconCompany::where('public_token', $token)
            ->with('subconStaff')
            ->firstOrFail();

        // Determine access level based on role
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
            'access_level' => $accessLevel,
            'role' => $role,
        ]);
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
        $company = SubconCompany::where('public_token', $token)->firstOrFail();
        $staff = SubconStaff::where('company_id', $company->id)
            ->where('id', $staffId)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:subcon_staff,email,' . $staff->id,
            'contact' => 'nullable|string|max:20',
            'role' => 'nullable|string|max:100',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $staff->update($validated);

        return redirect()->back()->with('success', 'Staff member updated successfully!');
    }

    /**
     * Delete staff member (leader only)
     */
    public function destroyStaff($token, $staffId)
    {
        $company = SubconCompany::where('public_token', $token)->firstOrFail();
        $staff = SubconStaff::where('company_id', $company->id)
            ->where('id', $staffId)
            ->firstOrFail();

        $staff->delete();

        return redirect()->back()->with('success', 'Staff member removed successfully!');
    }
}