<?php
// Add clearly identified, pending sample records; never invent approvals or attendance.
require __DIR__.'/../../vendor/autoload.php';
$app=require __DIR__.'/../../bootstrap/app.php';$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\{User,MonthlyReport,Inspection,ToolboxTalks,CompanyStaff,SubconCompany};
$m=MonthlyReport::withoutGlobalScopes()->where('period','2026-09')->where('project_id',25)->where('company_id',2)->firstOrFail();
Auth::setUser(User::where('company_id',$m->company_id)->whereNotIn('role_id',[7,8])->firstOrFail());
$subcons=DB::table('project_assign')->where('project_id',$m->project_id)->where('entity_type','compsub')->pluck('entity_id')->sort()->values();
if($subcons->all()!==[5,6]) throw new RuntimeException('Unexpected assignments; no data created.');
$inspector=CompanyStaff::where('company_id',$m->company_id)->findOrFail(13);
$topics=DB::table('toolbox_topic')->whereNotNull('inspection_category_id')->orderBy('id')->get()->groupBy('inspection_category_id')->take(5)->map(fn($g)=>$g->take(3))->values();
if($topics->count()<5 || $topics->contains(fn($g)=>$g->count()<3)) throw new RuntimeException('Insufficient topics.');
$tag='SAMPLE-SEP2026-P25';
$counts=DB::transaction(function()use($m,$subcons,$inspector,$topics,$tag){
 $talks=0;$inspections=0;
 foreach([2,8,14,21,28] as $index=>$day){
  $marker=$tag.'-'.($index+1);
  if(ToolboxTalks::where('project_id',$m->project_id)->where('review_comment',$marker.' - Sample data for report preview; verify before use.')->exists()) continue;
  $date=sprintf('2026-09-%02d 08:00:00',$day);
  $topicSet=$topics[$index];
  $talk=ToolboxTalks::create(['project_id'=>$m->project_id,'conducted'=>'yes','inspection_by'=>$inspector->id,'inspection_date'=>$date,'total_attended'=>0,'status'=>'pending_verification','review_comment'=>$marker.' - Sample data for report preview; verify before use.']);
  $talk->topics()->sync($topicSet->pluck('id')->all());
  $talk->categories()->sync([$topicSet->first()->inspection_category_id]);
  $talks++;
  foreach($subcons as $j=>$subcon){
   $evaluation=($index+$j)%4===0?'poor':'good';
   Inspection::create(['company_id'=>$m->company_id,'project_id'=>$m->project_id,'toolbox_talk_id'=>$talk->id,'subcon_company_id'=>$subcon,'inspection_by'=>$inspector->id,'topic_inspection_id'=>$topicSet->values()[$j]->id,'evaluation'=>$evaluation,'inspection_date'=>sprintf('2026-09-%02d 09:%02d:00',$day,$j*15),'location'=>'Sample inspection area '.($index+1),'description'=>$marker.' - Sample '.$evaluation.' finding for report preview; verify before use.','status'=>'pending_verification']);
   $inspections++;
  }
 }
 return compact('talks','inspections');
});
echo json_encode($counts).PHP_EOL;
echo 'Pending sample records only; approved reports unchanged.'.PHP_EOL;
