@extends('pdf.monthly-layout')
@section('body')
<table class="overview">
<tr><td class="label">Period</td><td>{{ \Carbon\Carbon::parse($r['period'].'-01')->format('F Y') }}</td><td class="label">Project</td><td>{{ $r['project'] }}</td></tr>
<tr><td class="label">Subcontractor</td><td>{{ $r['subcon'] }}</td><td class="label">Status / rank</td><td>{{ strtoupper(str_replace('_', ' ', $r['status'])) }} / {{ $r['rank'] ?: 'Not assessed' }}</td></tr>
</table>
<table class="grid" style="margin-top:12px"><tr><th>Monthly score</th><th>Approved inspections</th><th>Total findings</th><th>Total penalty</th></tr><tr><td>{{ $r['spgpnc'] !== null ? number_format($r['spgpnc'], 2).'%' : 'Not assessed' }}</td><td>{{ $r['inspections_approved'] }} / {{ $r['inspections_total'] }}</td><td>{{ $r['total'] }}</td><td>RM {{ number_format($r['penalty']['total'], 2) }}</td></tr></table>
<p class="muted">Trends use approved daily reports for this subcontractor and month. The subcontractor comparison uses project-wide monthly records. Charts reflect current source records; approved monthly summary figures may retain their saved values.</p>
@foreach($charts as $n => $chart)
@if($n % 2 === 1)<div class="analytics-page"></div>@endif
<div class="chart"><h2>{{ $n + 1 }}. {{ $chart['title'] }}</h2><img src="{{ $chart['image'] }}" alt="{{ $chart['title'] }}"><p class="muted" style="margin:0 0 5px">{{ $chart['note'] }}</p>
@if(!empty($chart['summary']))
<div class="summary">
<div class="summary-title">Summary</div>
<table class="summary-stats"><tr>@foreach($chart['summary']['stats'] as $stat)<td><span class="sl">{{ $stat[0] }}</span><span class="sv">{{ $stat[1] }}</span></td>@endforeach</tr></table>
<p class="summary-text">{{ $chart['summary']['text'] }}</p>
</div>
@endif
</div>
@endforeach
<div class="analytics-page">
<p class="eyebrow">{{ $r['project'] }} / {{ $r['period'] }}</p>
<h1>Toolbox summary</h1>
<p class="muted">Project-wide toolbox talks recorded during the month, across all subcontractors and approval statuses. Attendance totals count attendance per session, not unique workers.</p>
<table class="grid"><tr><th>Total talks</th><th>Conducted</th><th>Approved</th><th>Total attendance</th></tr><tr><td>{{ $toolboxSummary->count() }}</td><td>{{ $toolboxSummary->where('conducted', 'yes')->count() }}</td><td>{{ $toolboxSummary->where('status', 'approved')->count() }}</td><td>{{ $toolboxSummary->sum('total_attended') }}</td></tr></table>
<h2>Toolbox register</h2>
<table class="grid"><thead><tr><th style="width:5%">#</th><th style="width:14%">Date</th><th style="width:14%">Reference</th><th style="width:23%">Categories / topics</th><th style="width:17%">Conducted by</th><th style="width:8%">Held</th><th style="width:7%">Attend.</th><th style="width:12%">Status</th></tr></thead>
<tbody>
@forelse($toolboxSummary as $talk)
<tr><td>{{ $loop->iteration }}</td><td>{{ optional($talk->inspection_date)->format('d M Y') ?: '-' }}</td><td>{{ $talk->code ?: 'TBX-'.$talk->id }}</td><td>{{ $talk->categories->pluck('name')->merge($talk->topics->pluck('name'))->unique()->implode(', ') ?: '-' }}</td><td>{{ $talk->CompanyStaff?->name ?: '-' }}</td><td>{{ $talk->conducted === 'yes' ? 'Yes' : 'No' }}</td><td>{{ $talk->total_attended ?? '-' }}</td><td>{{ ucwords(str_replace('_', ' ', $talk->status)) }}</td></tr>
@empty
<tr><td colspan="8">No toolbox talks recorded for this month.</td></tr>
@endforelse
</tbody></table>
</div>
<div class="analytics-page">
<p class="eyebrow">{{ $r['project'] }} / {{ $r['period'] }} / {{ $r['subcon'] }}</p>
<h1>Inspection summary</h1>
<p class="muted">Inspections of {{ $r['subcon'] }} on this project during the month, including records awaiting approval. Score trends use approved records only.</p>
<table class="grid"><tr><th>Total inspections</th><th>Good</th><th>Poor</th><th>NC</th><th>CC</th></tr><tr><td>{{ $inspectionSummary->count() }}</td><td>{{ $inspectionSummary->where('evaluation', 'good')->count() }}</td><td>{{ $inspectionSummary->where('evaluation', 'poor')->count() }}</td><td>{{ $inspectionSummary->where('evaluation', 'nonconformance')->count() }}</td><td>{{ $inspectionSummary->where('evaluation', 'clientcomplaint')->count() }}</td></tr></table>
<h2>Inspection register</h2>
<table class="grid inspection-register">
<thead><tr><th style="width:4%">#</th><th style="width:12%">Date</th><th style="width:13%">Reference</th><th style="width:15%">Subcontractor</th><th style="width:16%">Topic</th><th style="width:10%">Evaluation</th><th style="width:16%">Inspected by</th><th style="width:14%">Status</th></tr></thead>
<tbody>
@forelse($inspectionSummary as $inspection)
<tr><td>{{ $loop->iteration }}</td><td>{{ optional($inspection->inspection_date)->format('d M Y') ?: '-' }}</td><td>{{ $inspection->code ?: 'INS-'.$inspection->id }}</td><td>{{ $inspection->subconCompany?->name ?: '-' }}</td><td>{{ $inspection->topic?->name ?: '-' }}</td><td>{{ ['good' => 'Good', 'poor' => 'Poor', 'nonconformance' => 'NC', 'clientcomplaint' => 'CC'][$inspection->evaluation] ?? ($inspection->evaluation ?: '-') }}</td><td>{{ $inspection->inspector?->name ?: '-' }}</td><td>{{ ucwords(str_replace('_', ' ', $inspection->status)) }}</td></tr>
@empty
<tr><td colspan="8">No inspections recorded for this month.</td></tr>
@endforelse
</tbody>
</table>
</div>
@if($r['review_comment'])<h2>Review comment</h2><div class="box">{{ $r['review_comment'] }}</div>@endif
@include('pdf._daily-signatures')
@endsection
