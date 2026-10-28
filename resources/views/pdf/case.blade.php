@extends('pdf.layout')
@section('body')
<h2>Case details</h2>
<table class="kv">
<tr><td class="k">Type</td><td class="v">{{ $c['type'] === 'nc' ? 'Non-Conformance' : 'Client Complaint' }}</td></tr>
<tr><td class="k">Project</td><td class="v">{{ $c['inspection']['project'] ?: '-' }}</td></tr>
<tr><td class="k">Subcontractor</td><td class="v">{{ $c['inspection']['subcon'] ?: '-' }}</td></tr>
<tr><td class="k">Topic</td><td class="v">{{ $c['inspection']['topic'] ?: '-' }}</td></tr>
<tr><td class="k">Location</td><td class="v">{{ $c['inspection']['location'] ?: '-' }}</td></tr>
<tr><td class="k">Inspector</td><td class="v">{{ $c['inspection']['inspector'] ?: '-' }}</td></tr>
<tr><td class="k">Inspection date</td><td class="v">{{ $c['inspection']['inspection_date'] ?: '-' }}</td></tr>
<tr><td class="k">Date opened</td><td class="v">{{ $c['date_open'] ?: '-' }}</td></tr>
<tr><td class="k">Date closed</td><td class="v">{{ $c['date_close'] ?: '-' }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-closed">APPROVED / CLOSED</span></td></tr>
</table>
<h2>Finding</h2>
<div class="box">{{ $c['inspection']['description'] ?: 'No description.' }}</div>
<h2>Subcontractor response</h2>
<div class="box">{{ $c['subcon_response'] ?: 'No response recorded.' }}</div>
@if($c['responded_by'] || $c['responded_at'])<div class="sub">Responded by {{ $c['responded_by'] ?: '-' }}@if($c['responded_at']) on {{ $c['responded_at'] }}@endif</div>@endif
@if($c['comment'])<h2>Reviewer comment</h2><div class="box">{{ $c['comment'] }}</div>@endif
@include('pdf._photos', ['list' => $photos])
@endsection
