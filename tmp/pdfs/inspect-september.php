<?php
require __DIR__.'/../../vendor/autoload.php';
$app=require __DIR__.'/../../bootstrap/app.php'; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
foreach(App\Models\MonthlyReport::withoutGlobalScopes()->where('period','2026-09')->get() as $m) {
 echo json_encode(['report'=>$m->id,'company'=>$m->company_id,'project'=>$m->project_id,'project_name'=>App\Models\Project::withoutGlobalScopes()->find($m->project_id)?->name,'subcon'=>$m->subcon_company_id,'status'=>$m->status]).PHP_EOL;
}
