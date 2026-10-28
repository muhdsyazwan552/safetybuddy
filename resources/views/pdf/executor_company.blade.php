<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Executor {{ $company->name }}</title>
<style>
    @page { margin: 14mm 12mm 16mm 12mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1f2937; }
    h1 { font-size: 16px; margin: 0; color: #111827; }
    h2 { font-size: 10.5px; margin: 14px 0 6px; padding: 4px 8px; background: #f0fdfa; border-left: 3px solid #0f766e; color: #115e59; text-transform: uppercase; letter-spacing: .5px; }
    .head { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 4px; }
    .head td { vertical-align: bottom; }
    .co { font-size: 11px; font-weight: bold; color: #0f766e; text-align: right; }
    table.kv { width: 100%; border-collapse: collapse; }
    table.kv td { padding: 4px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    table.kv td.k { width: 14%; color: #6b7280; }
    table.kv td.v { width: 36%; font-weight: bold; }
    table.grid { width: 100%; border-collapse: collapse; }
    table.grid th { background: #f3f4f6; text-align: left; padding: 5px 6px; border: 1px solid #d1d5db; font-size: 8.5px; text-transform: uppercase; }
    table.grid td { padding: 5px 6px; border: 1px solid #d1d5db; vertical-align: top; }
    table.grid tr { page-break-inside: avoid; }
    .c { text-align: center; }
    .ok { color: #065f46; font-weight: bold; }
    .no { color: #991b1b; font-weight: bold; }
    .wait { color: #92400e; }
    .badge { display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 8px; font-weight: bold; }
    .b-active { background: #d1fae5; color: #065f46; }
    .b-pending { background: #fef3c7; color: #92400e; }
    .b-inactive { background: #e5e7eb; color: #374151; }
    .small { color: #6b7280; font-size: 8px; }
    .muted { color: #9ca3af; }
</style>
</head>
<body>
@php $cs = strtolower((string) $company->status); @endphp
<table class="head"><tr>
    <td><h1>Executor company detail</h1>
        <div class="small">Generated {{ $generatedAt }}</div></td>
    <td class="co">{{ $company->name }}@if($company->code)<br><span class="small">{{ $company->code }}</span>@endif</td>
</tr></table>

<h2>Company</h2>
<table class="kv">
    <tr><td class="k">Name</td><td class="v">{{ $company->name }}</td><td class="k">Series number</td><td class="v">{{ $company->code ?: '-' }}</td></tr>
    <tr><td class="k">Email</td><td class="v">{{ $company->email ?: '-' }}</td><td class="k">Contact</td><td class="v">{{ $company->contact ?: '-' }}</td></tr>
    <tr><td class="k">Address</td><td class="v">{{ $company->address ?: '-' }}</td><td class="k">Status</td><td class="v"><span class="badge b-{{ $cs === 'active' ? 'active' : 'inactive' }}">{{ ucfirst($cs ?: 'inactive') }}</span></td></tr>
    <tr><td class="k">Staff</td><td class="v">{{ count($staff) }} total &middot; {{ collect($staff)->where('status', 'active')->count() }} active &middot; {{ collect($staff)->where('status', 'pending')->count() }} pending</td><td class="k">Machinery</td><td class="v">{{ count($machinery) }}</td></tr>
</table>

<h2>Safety passport &mdash; company rules {{ $induction['done'] }}/{{ $induction['total'] }} acknowledged by the leader</h2>
<table class="grid">
    <thead><tr><th width="24" class="c">#</th><th>Topic</th><th width="70" class="c">Acknowledged</th><th width="110">Date</th></tr></thead>
    <tbody>
    @forelse($induction['topics'] as $n => $t)
        <tr>
            <td class="c">{{ $n + 1 }}</td>
            <td>{{ $t['title'] }}</td>
            <td class="c">@if($t['acked'])<span class="ok">Yes</span>@else<span class="no">No</span>@endif</td>
            <td>{{ $t['acknowledged_at'] ? \Carbon\Carbon::parse($t['acknowledged_at'])->format('d M Y H:i') : '-' }}</td>
        </tr>
    @empty
        <tr><td colspan="4" class="c muted">No Safety Passport topics set up.</td></tr>
    @endforelse
    </tbody>
</table>

<h2>Staff ({{ count($staff) }})</h2>
<table class="grid">
    <thead>
        <tr>
            <th width="20" class="c">#</th>
            <th>Name</th>
            <th width="90">Series number</th>
            <th width="65">Role</th>
            <th width="62">Contact</th>
            <th width="46" class="c">Status</th>
            <th width="42" class="c">Safety passport</th>
            <th width="170">Approval</th>
        </tr>
    </thead>
    <tbody>
    @forelse($staff as $n => $s)
        @php $st = strtolower((string) ($s['status'] ?? '')); @endphp
        <tr>
            <td class="c">{{ $n + 1 }}</td>
            <td>{{ $s['name'] }}</td>
            <td>{{ $s['code'] ?? '-' }}</td>
            <td>{{ $s['role'] ?: '-' }}</td>
            <td>{{ $s['contact'] ?: '-' }}</td>
            <td class="c"><span class="badge b-{{ in_array($st, ['active', 'pending']) ? $st : 'inactive' }}">{{ ucfirst($st ?: 'inactive') }}</span></td>
            <td class="c">@if($s['is_safetypassport'] ?? false)<span class="ok">Yes</span>@else<span class="no">No</span>@endif</td>
            <td>
                @foreach(['Supervisor' => 'supervisor', 'Manager' => 'manager'] as $label => $k)
                    <div>
                        <b>{{ $label }}:</b>
                        @if($s[$k . '_approved_at'] ?? null)
                            <span class="ok">Approved</span>
                            <span class="small">{{ $s[$k . '_approved_name'] ? $s[$k . '_approved_name'] . ' · ' : '' }}{{ \Carbon\Carbon::parse($s[$k . '_approved_at'])->format('d M Y') }}</span>
                        @elseif($st === 'pending')
                            <span class="wait">Waiting</span>
                        @else
                            <span class="muted">-</span>
                        @endif
                    </div>
                @endforeach
            </td>
        </tr>
    @empty
        <tr><td colspan="8" class="c muted" style="padding:14px">No staff registered.</td></tr>
    @endforelse
    </tbody>
</table>
</body>
</html>
