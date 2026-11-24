@extends('pdf.monthly-layout')
@section('body')
{{-- cover page --}}
<div class="cover">
    @if(!empty($logo))
        <img class="logo" src="{{ $logo }}" alt="{{ $companyName }}">
        <p class="co-name">{{ $companyName }}</p>
    @else
        {{-- no logo uploaded: the initials of the company in a box --}}
        <table class="co-fallback"><tr><td>{{ \Illuminate\Support\Str::upper(\Illuminate\Support\Str::substr(preg_replace('/[^A-Za-z0-9]/', '', (string) $companyName), 0, 3)) ?: 'SB' }}</td></tr></table>
        <p class="co-name">{{ $companyName }}</p>
    @endif
    <h1 class="doc-title">Safety Performance<br>Report</h1>
    <p class="doc-sub">Monthly report &middot; {{ \Carbon\Carbon::parse($r['period'].'-01')->format('F Y') }}<br>{{ $r['project'] }} &middot; {{ $r['subcon'] }}<br>Report no. {{ $r['report_no'] ?: $refNo }}</p>
    <table class="sign-box">
        <tr><td class="k">NAME :</td><td></td></tr>
        <tr><td class="k">DESIGNATION :</td><td></td></tr>
        <tr><td class="k">DATE :</td><td></td></tr>
        <tr><td class="k">SIGNATURE :</td><td></td></tr>
    </table>
</div>

{{-- contents --}}
<div class="contents">
    <h1 class="contents-title">Report Contents :</h1>
    <ul>
        <li>1. Monthly Performance Overview<span class="desc">Monthly SPGPNC score, BSPR rank, penalties and the performance charts.</span></li>
        <li>2. Toolbox Talk<span class="desc">Toolbox talks of the project during the month.</span></li>
        <li>3. Inspection Evaluation Results<span class="desc">Inspections of the contractor: Good, Poor, NC and CC.</span></li>
        <li>4. Incidents<span class="desc">Incidents of the contractor, by type and status.</span></li>
        <li>5. Manhours<span class="desc">Workers, hours and man-hours worked, with the incident rate.</span></li>
    </ul>
</div>

<div class="analytics-page"></div>
<p class="eyebrow">Safety performance / Monthly analytics</p>
<h1 class="sec-title">1. Monthly Performance Overview</h1>
<table class="overview">
<tr><td class="label">Period</td><td>{{ \Carbon\Carbon::parse($r['period'].'-01')->format('F Y') }}</td><td class="label">Project</td><td>{{ $r['project'] }}</td></tr>
<tr><td class="label">Subcontractor</td><td>{{ $r['subcon'] }}</td><td class="label">Status / rank</td><td>{{ $r['status'] === 'approved' ? 'COMPLETE' : 'NOT COMPLETE' }} / {{ $r['rank'] ?: 'Not assessed' }}</td></tr>
</table>
<table class="grid" style="margin-top:12px"><tr><th>Monthly score</th><th>Approved inspections</th><th>Total findings</th><th>Total penalty</th></tr><tr><td>{{ $r['spgpnc'] !== null ? number_format($r['spgpnc'], 2).'%' : 'Not assessed' }}</td><td>{{ $r['inspections_approved'] }} / {{ $r['inspections_total'] }}</td><td>{{ $r['total'] }}</td><td>RM {{ number_format($r['penalty']['total'], 2) }}</td></tr></table>
<p class="muted">Trends use approved daily reports for this subcontractor and month. The subcontractor comparison uses project-wide monthly records. Charts reflect current source records; approved monthly summary figures may retain their saved values.</p>
@foreach($charts as $n => $chart)
@if($n % 2 === 1)<div class="analytics-page"></div>@endif
<div class="chart"><h2>1.{{ $n + 1 }} {{ $chart['title'] }}</h2><img src="{{ $chart['image'] }}" alt="{{ $chart['title'] }}"><p class="muted" style="margin:0 0 5px">{{ $chart['note'] }}</p>
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
<h1 class="sec-title">2. Toolbox Talk</h1>
<p class="muted">Project-wide toolbox talks recorded during the month, across all subcontractors and approval statuses. Attendance totals count attendance per session, not unique workers.</p>
<table class="grid"><tr><th>Total talks</th><th>Conducted</th><th>Approved</th><th>Total attendance</th></tr><tr><td>{{ $toolboxSummary->count() }}</td><td>{{ $toolboxSummary->where('conducted', 'yes')->count() }}</td><td>{{ $toolboxSummary->where('status', 'approved')->count() }}</td><td>{{ $toolboxSummary->sum('total_attended') }}</td></tr></table>
<h2>Toolbox register</h2>
<table class="grid"><thead><tr><th style="width:5%">#</th><th style="width:14%">Date</th><th style="width:14%">Reference</th><th style="width:23%">Categories / topics</th><th style="width:17%">Inspection by</th><th style="width:8%">Held</th><th style="width:7%">Attend.</th><th style="width:12%">Status</th></tr></thead>
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
<h1 class="sec-title">3. Inspection Evaluation Results</h1>
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
@php
    $statusLabel = ['open' => 'Open', 'inprogress' => 'In progress', 'closed' => 'Closed'];
    $fmt = fn ($v) => rtrim(rtrim(number_format($v, 2), '0'), '.');
@endphp
<div class="analytics-page">
<p class="eyebrow">{{ $r['project'] }} / {{ $r['period'] }} / {{ $r['subcon'] }}</p>
<h1 class="sec-title">4. Incidents</h1>
<p class="muted">Incidents of {{ $r['subcon'] }} on this project during the month. An incident is a safety event such as an injury, near miss or property damage that was reported in Safety Buddy.</p>
<table class="grid stat-grid"><tr>
    <td><span class="big">{{ $incidents->count() }}</span><span class="lbl">Total incidents</span></td>
    <td><span class="big">{{ $incidents->where('status', 'open')->count() }}</span><span class="lbl">Open</span></td>
    <td><span class="big">{{ $incidents->where('status', 'inprogress')->count() }}</span><span class="lbl">In progress</span></td>
    <td><span class="big">{{ $incidents->where('status', 'closed')->count() }}</span><span class="lbl">Closed</span></td>
</tr></table>
<table class="grid stat-grid" style="margin-top:6px"><tr>
    <td><span class="big">{{ (int) $incidents->sum('lti_worker_count') }}</span><span class="lbl">Workers with lost time (LTI)</span></td>
    <td><span class="big">{{ (int) $incidents->sum('lti_days_lost') }}</span><span class="lbl">Days lost</span></td>
    <td><span class="big">{{ (int) $incidents->sum('manhours_lost') }}</span><span class="lbl">Man-hours lost</span></td>
    <td><span class="big">{{ $incidentRate !== null ? $fmt($incidentRate) : '-' }}</span><span class="lbl">Incidents per 100,000 man-hours</span></td>
</tr></table>
<h2>Incidents by type</h2>
<table class="grid"><thead><tr><th>Incident type</th><th class="n" style="width:14%">Incidents</th></tr></thead><tbody>
@forelse($incidents->groupBy(fn ($i) => optional($i->incidentType)->name ?: 'Not specified') as $type => $group)
<tr><td>{{ $type }}</td><td class="n">{{ $group->count() }}</td></tr>
@empty
<tr><td colspan="2">No incident was reported for this month.</td></tr>
@endforelse
</tbody></table>
<h2>Incident register</h2>
<table class="grid"><thead><tr><th style="width:5%">#</th><th style="width:13%">Date</th><th style="width:15%">Reference</th><th style="width:20%">Type</th><th style="width:17%">Injury</th><th style="width:17%">Location</th><th style="width:13%">Status</th></tr></thead><tbody>
@forelse($incidents as $incident)
<tr><td>{{ $loop->iteration }}</td><td>{{ optional($incident->incident_date)->format('d M Y') ?: '-' }}</td><td>{{ $incident->code ?: 'INC-'.$incident->id }}</td><td>{{ optional($incident->incidentType)->name ?: '-' }}</td><td>{{ trim(optional($incident->injuryType)->name.' '.($incident->body_part ? '('.$incident->body_part.')' : '')) ?: '-' }}</td><td>{{ $incident->location ?: '-' }}</td><td>{{ $statusLabel[$incident->status] ?? ucfirst((string) $incident->status) }}</td></tr>
@empty
<tr><td colspan="7">No incident recorded for this month.</td></tr>
@endforelse
</tbody></table>
</div>
<div class="analytics-page">
<p class="eyebrow">{{ $r['project'] }} / {{ $r['period'] }} / {{ $r['subcon'] }}</p>
<h1 class="sec-title">5. Manhours</h1>
<p class="muted">Man-hours are the number of workers multiplied by the working hours of each day recorded for {{ $r['subcon'] }} on this project.</p>
<table class="grid stat-grid"><tr>
    <td><span class="big">{{ $manhourDays->count() }}</span><span class="lbl">Days worked</span></td>
    <td><span class="big">{{ $manhourDays->sum('workers') }}</span><span class="lbl">Total worker-days</span></td>
    <td><span class="big">{{ $manhourDays->count() ? $fmt($manhourDays->avg('workers')) : '-' }}</span><span class="lbl">Average workers per day</span></td>
    <td><span class="big">{{ $fmt($totalManhours) }}</span><span class="lbl">Total man-hours</span></td>
</tr></table>
<h2>Daily manhours</h2>
<table class="grid"><thead><tr><th style="width:8%">#</th><th>Date</th><th class="n" style="width:16%">Workers</th><th class="n" style="width:18%">Hours per worker</th><th class="n" style="width:18%">Man-hours</th></tr></thead><tbody>
@forelse($manhourDays as $day)
<tr><td>{{ $loop->iteration }}</td><td>{{ \Carbon\Carbon::parse($day['date'])->format('D, d M Y') }}</td><td class="n">{{ $day['workers'] }}</td><td class="n">{{ $fmt($day['hours']) }}</td><td class="n">{{ $fmt($day['manhours']) }}</td></tr>
@empty
<tr><td colspan="5">No manhours recorded for this month.</td></tr>
@endforelse
@if($manhourDays->count())
<tr><th colspan="2">Total</th><th class="n">{{ $manhourDays->sum('workers') }}</th><th></th><th class="n">{{ $fmt($totalManhours) }}</th></tr>
@endif
</tbody></table>

<h2>Lost Time Injury (LTI) and Cumulative LTIFR</h2>
<p class="muted">LTI data comes from the Incident module. Man-hours come from the daily attendance submitted through the Contractor Portal and are summarised by month, from January to {{ \Carbon\Carbon::createFromFormat('Y-m', $r['period'])->format('F Y') }}.</p>
<table class="grid"><thead><tr><th>Month</th><th class="n">Manhours</th><th class="n">LTI (Lost Time Injury)</th><th class="n">Cumulative manhours</th><th class="n">Cumulative LTI</th><th class="n">Cumulative LTIFR</th></tr></thead><tbody>
@foreach($ltifrRows as $row)
<tr><td>{{ strtoupper($row['month']) }}</td><td class="n">{{ $fmt($row['manhours']) }}</td><td class="n">{{ $row['lti'] ?: '' }}</td><td class="n">{{ $fmt($row['cum_manhours']) }}</td><td class="n">{{ $row['cum_lti'] }}</td><td class="n">{{ $row['ltifr'] !== null ? number_format($row['ltifr'], 2) : '-' }}</td></tr>
@endforeach
@php $last = end($ltifrRows); @endphp
<tr><th>Overall</th><th class="n">{{ $fmt($last['cum_manhours']) }}</th><th class="n">{{ $last['cum_lti'] }}</th><th></th><th></th><th class="n">{{ $last['ltifr'] !== null ? number_format($last['ltifr'], 2) : '-' }}</th></tr>
</tbody></table>
<div class="box" style="page-break-inside:avoid">
<b>Formula</b><br>
Cumulative LTIFR = (Total LTI cases to date &times; 1,000,000) &divide; Total manhours worked to date<br>
@if($last['ltifr'] !== null)
{{ strtoupper($last['month']) }}: ({{ $last['cum_lti'] }} &times; 1,000,000) &divide; {{ $fmt($last['cum_manhours']) }} = <b>{{ number_format($last['ltifr'], 2) }}</b><br>
@endif
<span class="muted">Cumulative LTIFR shows the number of lost time injuries per 1,000,000 hours worked from the start of the reporting period (January) to the month shown. A month without man-hours recorded shows &ldquo;-&rdquo; until man-hours exist.</span>
</div>
</div>
@if($r['review_comment'])<h2>Review comment</h2><div class="box">{{ $r['review_comment'] }}</div>@endif
@include('pdf._daily-signatures')
@endsection
