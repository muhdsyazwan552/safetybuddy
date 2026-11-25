<?php

namespace App\Http\Controllers;

use App\Support\UploadedAssets;
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
            'city' => ['nullable', 'string', 'max:100'],
            'postcode' => ['nullable', 'string', 'max:10'],
            'state' => ['nullable', 'string', 'in:'.implode(',', \App\Http\Controllers\PublicTrainingProviderController::STATES)],
        ]);

        $company->fill($validated);
        $moved = $company->isDirty(['address', 'city', 'postcode', 'state']);
        $company->save();

        // work out the map position again only when the address changed
        if ($moved) {
            $point = \App\Services\Geocoder::locate($company->address, $company->city, $company->postcode, $company->state);
            $company->update(['latitude' => $point[0] ?? null, 'longitude' => $point[1] ?? null]);
        }

        return redirect('/profile#company')->with('success', 'Company details updated');
    }

    public function uploadLogo(Request $request): RedirectResponse
    {
        $company = Company::findOrFail($request->user()->company_id);
        $validated = $request->validate([
            'logo' => ['required', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $oldPath = $company->logo_path;
        try {
            $newPath = UploadedAssets::store($validated['logo'], "companies/{$company->id}/logos");
        } catch (\League\Flysystem\UnableToWriteFile $e) {
            return back()->withErrors(['logo' => 'The logo could not be saved. Please try again.']);
        }

        try {
            $company->update(['logo_path' => $newPath]);
        } catch (\Throwable $exception) {
            UploadedAssets::delete($newPath);
            throw $exception;
        }

        if ($oldPath) {
            UploadedAssets::delete($oldPath);
        }

        return redirect('/profile#company')->with('success', 'Company logo updated');
    }
}
