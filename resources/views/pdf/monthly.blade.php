@extends('pdf.layout')
@section('body')
<h2>Report details</h2>
<table class="kv">
<tr><td class="k">Report no.</td><td class="v">{{ $r['report_no'] ?: '-' }}</td></tr>
<tr><td class="k">Period</td><td class="v">{{ \Carbon\Carbon::parse($r['period'] . '-01')->format('F Y') }}</td></tr>
<tr><td class="k">Project</td><td class="v">{{ $r['project'] }}</td></tr>
<tr><td class="k">Subcontractor</td><td class="v">{{ $r['subcon'] }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-{{ $r['status'] }}">{{ strtoupper(str_replace('_', ' ', $r['status'])) }}</span></td></tr>
<tr><td class="k">Inspections approved</td><td class="v">{{ $r['inspections_approved'] }} / {{ $r['inspections_total'] }}</td></tr>
<tr><td class="k">Safety Passport</td><td class="v">{{ $r['sp_compliant'] }} compliant of {{ $r['sp_observations'] }} observations</td></tr>
</table>
@include('pdf._score')
@if(!empty($r['days']) && count($r['days']))
<h2>Daily reports in this month</h2>
<table class="grid"><tr><th>Date</th><th>Status</th><th class="n">SPGPNC</th><th>Rank</th><th class="n">Penalty</th></tr>
@foreach($r['days'] as $d)<tr><td>{{ $d['date'] }}</td><td>{{ str_replace('_', ' ', $d['status']) }}</td><td class="n">{{ $d['spgpnc'] !== null ? number_format((float) $d['spgpnc'], 2) . '%' : '-' }}</td><td>{{ $d['rank'] ?: '-' }}</td><td class="n">{{ number_format($d['penalty'], 2) }}</td></tr>@endforeach
</table>
@endif
@if($r['review_comment'])<h2>Review comment</h2><div class="box">{{ $r['review_comment'] }}</div>@endif
@endsection
