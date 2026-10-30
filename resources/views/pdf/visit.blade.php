@extends('pdf.layout')
@section('body')
<h2>Site visit summary</h2>
<table class="kv">
<tr><td class="k">Project</td><td class="v">{{ $project ?: '-' }}</td></tr>
<tr><td class="k">Date</td><td class="v">{{ $date ?: '-' }}</td></tr>
<tr><td class="k">Inspector</td><td class="v">{{ $by ?: '-' }}</td></tr>
<tr><td class="k">Toolbox talk</td><td class="v">{{ $t ? ($t->conducted === 'yes' ? 'Conducted' : 'Not conducted') : 'Not recorded' }}</td></tr>
<tr><td class="k">Inspections</td><td class="v">{{ count($inspections) }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-approved">APPROVED</span></td></tr>
</table>

@if($t)
<div style="margin-top:14px;font-size:13px;font-weight:bold;color:#0f766e">Part 1 &middot; Toolbox talk{{ $t->code ? ' ' . $t->code : '' }}</div>
@include('pdf._toolbox_body')
@endif

@foreach($inspections as $n => $row)
@php($i = $row['i'])
@php($category = $row['category'])
@php($photos = $row['photos'])
<div style="page-break-before: always; font-size:13px;font-weight:bold;color:#0f766e">Part {{ $t ? 2 : 1 }} &middot; Inspection {{ $n + 1 }} of {{ count($inspections) }}@if($i->code) &middot; {{ $i->code }}@endif</div>
@include('pdf._inspection_body')
@endforeach
@endsection
