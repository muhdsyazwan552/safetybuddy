@php $f = fn ($v) => $v === null ? '-' : number_format((float) $v, 2) . '%'; @endphp
<h2>Findings</h2>
<table class="grid"><tr><th>Good</th><th>Poor</th><th>NC</th><th>CC</th><th>Total</th></tr>
<tr><td>{{ $r['good'] }}</td><td>{{ $r['poor'] }}</td><td>{{ $r['nc'] }}</td><td>{{ $r['cc'] }}</td><td>{{ $r['total'] }}</td></tr></table>
<h2>SPGPNC score</h2>
<table class="grid"><tr><th>SP</th><th>G</th><th>P</th><th>N</th><th>C</th><th>SPGPNC</th><th>BSPR rank</th></tr>
<tr><td>{{ $f($r['sp']) }}</td><td>{{ $f($r['g']) }}</td><td>{{ $f($r['p']) }}</td><td>{{ $f($r['n']) }}</td><td>{{ $f($r['c']) }}</td><td><b>{{ $f($r['spgpnc']) }}</b></td><td>@if($r['rank'])<span class="badge b-{{ $r['rank'] }}">{{ $r['rank'] }}</span>@else - @endif</td></tr></table>
<h2>Penalty</h2>
<table class="grid"><tr><th>SP</th><th>G</th><th>P</th><th>NC</th><th>CC</th><th>Total</th></tr>
<tr><td>{{ number_format($r['penalty']['sp'], 2) }}</td><td>{{ number_format($r['penalty']['g'], 2) }}</td><td>{{ number_format($r['penalty']['p'], 2) }}</td><td>{{ number_format($r['penalty']['nc'], 2) }}</td><td>{{ number_format($r['penalty']['cc'], 2) }}</td><td><b>{{ number_format($r['penalty']['total'], 2) }}</b></td></tr></table>
