<?php

namespace App\Http\Controllers;

use App\Models\ComplianceMetrics;
use App\Models\PenaltySettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MetricController extends Controller
{
    public function storeMetrics(Request $request)
{
    $validated = $request->validate([
        'company_id' => 'required|exists:executor_companies,id',
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:255',
        'percent' => 'required|integer|min:0|max:100',
    ]);

    ComplianceMetrics::create([
        'company_id' => $validated['company_id'],
        'title' => $validated['title'], 
        'description' => $validated['description'],
        'percent' => $validated['percent'],
    ]);

    return back()->with('success', 'Metric added successfully.');
}

public function updateMetrics(Request $request, $id)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:255',
        'percent' => 'required|numeric|min:0|max:100',
    ]);

    $metric = ComplianceMetrics::where('id', $id)
              ->where('company_id', Auth::user()->company_id)
              ->firstOrFail();

    $metric->update($validated);

    return back()->with('success', 'Metric updated successfully.');
}

public function destroyMetrics($id)
{
    $metric = ComplianceMetrics::where('id', $id)
              ->where('company_id', Auth::user()->company_id)
              ->firstOrFail();

    $metric->delete();

    return back()->with('success', 'Metric deleted successfully.');
}



 public function storePenalty(Request $request)
{
    $validated = $request->validate([
        'company_id' => 'required|exists:executor_companies,id',
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:255',
        'value' => 'required|numeric|min:0',
    ]);

    PenaltySettings::create([
        'company_id' => $validated['company_id'],
        'title' => $validated['title'], 
        'description' => $validated['description'],
        'value' => $validated['value'],
    ]);

    return back()->with('success', 'Metric added successfully.');
}

public function updatePenalty(Request $request, $id)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:255',
        'value' => 'required|numeric|min:0',
    ]);

    $metric = PenaltySettings::where('id', $id)
              ->where('company_id', Auth::user()->company_id)
              ->firstOrFail();

    $metric->update($validated);

    return back()->with('success', 'Metric updated successfully.');
}

public function destroyPenalty($id)
{
    $metric = PenaltySettings::where('id', $id)
              ->where('company_id', Auth::user()->company_id)
              ->firstOrFail();

    $metric->delete();

    return back()->with('success', 'Metric deleted successfully.');
}
}