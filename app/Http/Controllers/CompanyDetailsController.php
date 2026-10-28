<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompanyDetailsController extends Controller
{
    /**
     * Company profile page for the logged-in company account.
     */
    public function show(): RedirectResponse
    {
        return redirect('/profile#company');
    }

    /**
     * Update the company's own details.
     */
    public function update(Request $request): RedirectResponse
    {
        $company = Company::findOrFail(Auth::user()->company_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
        ]);

        $company->update($validated);

        return redirect('/profile#company')->with('success', 'Company details updated');
    }
}
