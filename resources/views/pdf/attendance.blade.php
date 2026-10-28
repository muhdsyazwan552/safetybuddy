@extends('pdf.layout')
@section('body')
<h2>Summary</h2>
<table class="kv">
<tr><td class="k">Date</td><td class="v">{{ \Carbon\Carbon::parse($date)->format('d M Y') }}</td></tr>
<tr><td class="k">Total workers</td><td class="v">{{ $totalWorkers }}</td></tr>
<tr><td class="k">Total man-hours</td><td class="v">{{ rtrim(rtrim(number_format($totalHours, 2), '0'), '.') }}</td></tr>
</table>
@forelse($groups as $g)
<h2>{{ $g['project'] }}</h2>
@foreach($g['subcons'] as $s)
<table class="grid" style="margin-bottom:8px">
<tr><th colspan="4" style="background:#e5e7eb">{{ $s['name'] }} &middot; {{ count($s['staff']) }} worker(s) &middot; {{ rtrim(rtrim(number_format($s['manhours'], 2), '0'), '.') }} h</th></tr>
<tr><th width="30">#</th><th>Name</th><th>Role</th><th class="n" width="60">Hours</th></tr>
@foreach($s['staff'] as $n => $w)<tr><td>{{ $n + 1 }}</td><td>{{ $w['name'] }}</td><td>{{ $w['role'] ?: '-' }}</td><td class="n">{{ rtrim(rtrim(number_format($w['hours'], 2), '0'), '.') }}</td></tr>@endforeach
</table>
@endforeach
@empty
<div class="muted" style="margin-top:12px">No attendance recorded for this date.</div>
@endforelse
@endsection
