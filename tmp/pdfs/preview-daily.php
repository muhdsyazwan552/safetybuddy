<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$r = App\Models\InspectionReport::findOrFail(5);
$user = App\Models\User::where('company_id', $r->company_id)->whereNotIn('role_id', [7, 8])->firstOrFail();
Illuminate\Support\Facades\Auth::setUser($user);
$response = app(App\Http\Controllers\PdfReportController::class)->daily(5);
file_put_contents(__DIR__.'/daily-5-preview.pdf', $response->getContent());
echo "Generated daily-5-preview.pdf\n";
