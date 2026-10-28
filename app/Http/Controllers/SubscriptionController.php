<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{

    public function index()
    {
        return redirect()->route(SubscriptionPlanController::hasActiveSafety((int) Auth::user()->company_id)
            ? 'dashboard.inspection'
            : 'subscription.plans');
    }
}
