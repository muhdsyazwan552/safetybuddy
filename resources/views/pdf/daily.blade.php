@extends('pdf.daily-layout')
@section('body')
<table class="overview">
<tr><td class="label">Project</td><td>{{ $r['project'] }}</td><td class="label">Subcontractor</td><td>{{ $r['subcon'] }}</td></tr>
<tr><td class="label">Date</td><td>{{ \Carbon\Carbon::parse($r['date'])->format('d M Y') }}</td><td class="label">Safety Passport</td><td>{{ $r['sampled'] ?? '-' }} sampled / {{ $r['not_registered'] ?? '-' }} not registered</td></tr>
<tr><td class="label">Report no.</td><td>{{ $r['report_no'] ?: $refNo }}</td><td class="label">Penalty review</td><td>{{ strtoupper(str_replace('_', ' ', $r['penalty_status'])) }}</td></tr>
<tr><td class="label">Status</td><td colspan="3">{{ strtoupper(str_replace('_', ' ', $r['status'])) }}</td></tr>
</table>
@include('pdf._score', ['plainText' => true])
@if(!empty($r['follow_up']))
<h2>Follow-up</h2>
<table class="grid">@foreach($r['follow_up'] as $f)<tr><td>{{ $f }}</td></tr>@endforeach</table>
@endif

@if(count($talks))
@foreach($talks as $n => $row)
@php($t = $row['t'])
@php($imgGroup = $row['imgGroup'])
@php($imgAttendance = $row['imgAttendance'])
<div class="record-heading">Toolbox talk {{ $n + 1 }} of {{ count($talks) }}@if($t->code) &middot; {{ $t->code }}@endif</div>
@include('pdf._toolbox_body', ['plainText' => true, 'hideVisitInspections' => true])
@endforeach
@endif

@foreach($inspections as $n => $row)
@php($i = $row['i'])
@php($category = $row['category'])
@php($photos = $row['photos'])
<div class="record-heading">Inspection {{ $n + 1 }} of {{ count($inspections) }}@if($i->code) &middot; {{ $i->code }}@endif</div>
@include('pdf._inspection_body', ['plainText' => true])
@endforeach

@if(!count($talks) && !count($inspections))
<div class="muted" style="margin-top:12px">No approved inspection or toolbox talk is recorded for this day.</div>
@endif
@include('pdf._daily-signatures')
@endsection
