@extends('pdf.layout')
@section('body')
<h2>Report details</h2>
<table class="kv">
<tr><td class="k">Report no.</td><td class="v">{{ $r['report_no'] ?: '-' }}</td></tr>
<tr><td class="k">Date</td><td class="v">{{ \Carbon\Carbon::parse($r['date'])->format('d M Y') }}</td></tr>
<tr><td class="k">Project</td><td class="v">{{ $r['project'] }}</td></tr>
<tr><td class="k">Subcontractor</td><td class="v">{{ $r['subcon'] }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-{{ $r['status'] }}">{{ strtoupper(str_replace('_', ' ', $r['status'])) }}</span></td></tr>
<tr><td class="k">Safety Passport</td><td class="v">{{ $r['sampled'] ?? '-' }} sampled / {{ $r['not_registered'] ?? '-' }} not registered</td></tr>
<tr><td class="k">Penalty review</td><td class="v">{{ strtoupper(str_replace('_', ' ', $r['penalty_status'])) }}</td></tr>
</table>
@include('pdf._score')
@if(!empty($r['follow_up']))
<h2>Follow-up</h2>
<table class="grid">@foreach($r['follow_up'] as $f)<tr><td>{{ $f }}</td></tr>@endforeach</table>
@endif
@endsection
