<?php

namespace App\Http\Controllers;

use App\Models\ComplianceMetrics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Compliance Metrics + Penalty Settings are one table now:
 * title, description, percent setting and penalty value (RM) live on the same row.
 */
class MetricController extends Controller
{
    private function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:255',
            'percent' => 'nullable|numeric|min:0|max:100',
            'value' => 'nullable|numeric|min:0|max:99999999',
        ];
    }

    /** "" and null both mean "not set". */
    private function numberOrNull($value)
    {
        return ($value === '' || $value === null) ? null : $value;
    }

    private function ownMetric($id): ComplianceMetrics
    {
        return ComplianceMetrics::where('id', $id)
            ->where('company_id', Auth::user()->company_id)
            ->firstOrFail();
    }

    public function storeMetrics(Request $request)
    {
        $validated = $request->validate($this->rules());

        ComplianceMetrics::create([
            // never trust a company id sent by the browser
            'company_id' => Auth::user()->company_id,
            'title' => trim($validated['title']),
            'description' => trim($validated['description']),
            'percent' => $this->numberOrNull($validated['percent'] ?? null),
            'value' => $this->numberOrNull($validated['value'] ?? null),
        ]);

        return back()->with('success', 'Setting added successfully.');
    }

    public function updateMetrics(Request $request, $id)
    {
        $validated = $request->validate($this->rules());

        $this->ownMetric($id)->update([
            'title' => trim($validated['title']),
            'description' => trim($validated['description']),
            'percent' => $this->numberOrNull($validated['percent'] ?? null),
            'value' => $this->numberOrNull($validated['value'] ?? null),
        ]);

        return back()->with('success', 'Setting updated successfully.');
    }

    public function destroyMetrics($id)
    {
        $this->ownMetric($id)->delete();

        return back()->with('success', 'Setting deleted successfully.');
    }

    /** Create the starter rows for a company that has none yet. */
    public function loadDefaults()
    {
        $companyId = Auth::user()->company_id;

        if (ComplianceMetrics::where('company_id', $companyId)->exists()) {
            return back()->with('error', 'You already have settings. Defaults are only loaded into an empty list.');
        }

        // [title, description, percent, penalty value RM]
        $defaults = [
            ['Target Compliance Rate for Safety Passport', 'Assess the compliance rate of the Safety Passport through a sampling check.', 0, 100],
            ["Target for Overall Compliance Level 'GOOD'", "Evaluate the performance for Level 'GOOD' overall compliance.", 0, 100],
            ["Threshold for Overall Compliance Level 'POOR'", "Monitor the threshold for Level 'POOR' overall compliance.", 0, 0],
            ['Non-Conformance (NC)', 'Penalties will be based on the total number of NCs.', null, 100],
            ['Client Complaint (CC)', 'Penalties will be based on the total number of CCs.', null, 0],
            ["Minimum Requirement for Best Safety Practices Ranking (BSPR) 'GOLD'", "BSPR 'GOLD' = Indicates that safety compliance practices meet the highest standards of excellence.", 0, null],
            ["Minimum Requirement for Best Safety Practices Ranking (BSPR) 'SILVER'", "BSPR 'SILVER' = Indicates that safety compliance practices meet average standards.", 0, null],
        ];

        foreach ($defaults as [$title, $description, $percent, $value]) {
            ComplianceMetrics::create([
                'company_id' => $companyId,
                'title' => $title,
                'description' => $description,
                'percent' => $percent,
                'value' => $value,
            ]);
        }

        return back()->with('success', 'Default settings loaded. Adjust the percent and penalty values to suit your company.');
    }
}
