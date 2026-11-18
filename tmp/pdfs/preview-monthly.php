<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$m = App\Models\MonthlyReport::withoutGlobalScopes()->findOrFail(5);
$user = App\Models\User::where('company_id', $m->company_id)->whereNotIn('role_id', [7,8])->firstOrFail();
Illuminate\Support\Facades\Auth::setUser($user);
$response = app(App\Http\Controllers\PdfReportController::class)->monthly($m->id);
file_put_contents(__DIR__.'/monthly-preview.pdf', $response->getContent());
echo 'Generated monthly report '.$m->id.PHP_EOL;
