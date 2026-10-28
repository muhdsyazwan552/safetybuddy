@extends('pdf.layout')
@php $n = fn ($v) => rtrim(rtrim(number_format($v, 2), '0'), '.'); @endphp
@section('body')
<h2>Summary</h2>
<table class="kv">
@foreach($filters as $k => $v)<tr><td class="k">{{ $k }}</td><td class="v">{{ $v }}</td></tr>@endforeach
<tr><td class="k">Days with records</td><td class="v">{{ count($days) }}</td></tr>
<tr><td class="k">Entries</td><td class="v">{{ $total['entries'] }}</td></tr>
<tr><td class="k">Total workers (sum of daily)</td><td class="v">{{ $total['workers'] }}</td></tr>
<tr><td class="k">Total manhours</td><td class="v">{{ $n($total['manhours']) }} h</td></tr>
</table>

<h2>By project</h2>
<table class="grid"><tr><th>Project</th><th class="n">Entries</th><th class="n">Workers</th><th class="n">Manhours</th></tr>
@foreach($byProject as $r)<tr><td>{{ $r['name'] }}</td><td class="n">{{ $r['entries'] }}</td><td class="n">{{ $r['workers'] }}</td><td class="n">{{ $n($r['manhours']) }}</td></tr>@endforeach
<tr><th>Total</th><th class="n">{{ $total['entries'] }}</th><th class="n">{{ $total['workers'] }}</th><th class="n">{{ $n($total['manhours']) }}</th></tr></table>

<h2>By subcontractor</h2>
<table class="grid"><tr><th>Subcontractor</th><th class="n">Entries</th><th class="n">Workers</th><th class="n">Manhours</th></tr>
@foreach($bySubcon as $r)<tr><td>{{ $r['name'] }}</td><td class="n">{{ $r['entries'] }}</td><td class="n">{{ $r['workers'] }}</td><td class="n">{{ $n($r['manhours']) }}</td></tr>@endforeach
<tr><th>Total</th><th class="n">{{ $total['entries'] }}</th><th class="n">{{ $total['workers'] }}</th><th class="n">{{ $n($total['manhours']) }}</th></tr></table>

<h2>By day</h2>
@forelse($days as $d)
<table class="grid" style="margin-bottom:8px">
<tr><th colspan="5" style="background:#e5e7eb">{{ \Carbon\Carbon::parse($d['date'])->format('l, d M Y') }} &middot; {{ $d['workers'] }} workers &middot; {{ $n($d['manhours']) }} h</th></tr>
<tr><th>Project</th><th>Subcontractor</th><th class="n" width="50">Workers</th><th class="n" width="60">Hrs/worker</th><th class="n" width="60">Manhours</th></tr>
@foreach($d['rows'] as $r)<tr><td>{{ $r['project'] }}</td><td>{{ $r['subcon'] }}</td><td class="n">{{ $r['workers'] }}</td><td class="n">{{ $n($r['hours']) }}</td><td class="n">{{ $n($r['manhours']) }}</td></tr>@endforeach
</table>
@empty
<div class="muted">No manhour records match these filters.</div>
@endforelse
@endsection
