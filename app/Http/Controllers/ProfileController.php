<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->loadMissing('role', 'company');
        $isCompanyAdmin = (int) $user->role_id === 2 && $user->company;
        $subscription = $isCompanyAdmin
            ? SubscriptionPlanController::detailsForCompany((int) $user->company_id)
            : null;

        return Inertia::render('Profile/Edit', [
            'title' => 'Settings',
            'mustVerifyEmail' => $user instanceof MustVerifyEmail && $user->email_verification_required,
            'status' => session('status'),
            'company' => $isCompanyAdmin ? $user->company->only([
                'id', 'code', 'name', 'registration_no', 'email', 'contact', 'address', 'city', 'postcode', 'state', 'status',
            ]) + ['logo_url' => $user->company->logo_url] : null,
            'accountType' => $isCompanyAdmin ? $this->accountType($user->company) : null,
            'subscription' => $subscription,
            'account' => [
                'role' => $user->role->display_name ?? $user->role->name ?? null,
                'role_id' => $user->role_id,
                'company' => $user->company->name ?? null,
                'member_since' => optional($user->created_at)->format('d M Y'),
                'email_verified' => (bool) $user->email_verified_at,
            ],
        ]);
    }

    /** Account type of the company, plus the Training Provider it is registered under (if any). */
    private function accountType(\App\Models\Company $company): array
    {
        $company->loadMissing('accountType:id,name', 'trainingProvider:id,name,email,contact');
        $provider = $company->trainingProvider;

        return [
            'id' => (int) $company->account_type_id,
            'name' => $company->accountType?->name,
            'provider' => $provider ? [
                'name' => $provider->name,
                'email' => $provider->email,
                'contact' => $provider->contact,
                'linked_at' => $company->provider_linked_at?->format('Y-m-d'),
            ] : null,
            'trainees' => (int) $company->account_type_id === \App\Models\AccountType::TRAINING_PROVIDER
                ? \App\Models\Company::where('training_provider_company_id', $company->id)->count()
                : null,
        ];
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // name and phone only; the email cannot be edited
        $request->user()->fill($request->validated())->save();

        return Redirect::route('profile.edit')->with('success', 'Profile updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
