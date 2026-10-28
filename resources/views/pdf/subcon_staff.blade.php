<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Staff list {{ $company->name }}</title>
<style>
    @page { margin: 14mm 12mm 16mm 12mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1f2937; }
    h1 { font-size: 16px; margin: 0; color: #111827; }
    .sub { color: #6b7280; margin: 2px 0 10px; }
    .head { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 8px; }
    .head td { vertical-align: bottom; }
    .co { font-size: 11px; font-weight: bold; color: #0f766e; text-align: right; }
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
<table class="head"><tr>
    <td><h1>Staff list &mdash; {{ $filter === 'active' ? 'Active staff' : 'All staff' }}</h1>
        <div class="sub" style="margin:2px 0 0">Generated {{ $generatedAt }} &middot; {{ $staff->count() }} staff</div></td>
    <td class="co">{{ $company->name }}@if($company->code)<br><span class="small">{{ $company->code }}</span>@endif</td>
</tr></table>

<table class="grid">
    <thead>
        <tr>
            <th width="24" class="c">#</th>
            <th>Name</th>
            <th width="105">Series number</th>
            <th width="80">Role</th>
            <th width="62" class="c">Status</th>
            <th width="62" class="c">Safety passport</th>
            <th width="120">Supervisor approval</th>
            <th width="120">Manager approval</th>
        </tr>
    </thead>
    <tbody>
    @forelse($staff as $n => $s)
        @php $st = strtolower((string) $s->status); @endphp
        <tr>
            <td class="c">{{ $n + 1 }}</td>
            <td>{{ $s->name }}</td>
            <td>{{ $s->code ?: '-' }}</td>
            <td>{{ $s->role ?: '-' }}</td>
            <td class="c"><span class="badge b-{{ in_array($st, ['active', 'pending']) ? $st : 'inactive' }}">{{ ucfirst($st ?: 'inactive') }}</span></td>
            <td class="c">@if($s->is_safetypassport)<span class="ok">Yes</span>@else<span class="no">No</span>@endif</td>
            @foreach([['supervisor_approved_at', 'supervisor_approved_by'], ['manager_approved_at', 'manager_approved_by']] as [$at, $by])
                <td>
                    @if($s->$at)
                        <span class="ok">Approved</span><br>
                        <span class="small">{{ $approvers[$s->$by] ?? '' }}{{ $approvers[$s->$by] ?? null ? ' · ' : '' }}{{ $s->$at->format('d M Y') }}</span>
                    @elseif($st === 'pending')
                        <span class="wait">Waiting</span>
                    @else
                        <span class="muted">-</span>
                    @endif
                </td>
            @endforeach
        </tr>
    @empty
        <tr><td colspan="8" class="c muted" style="padding:14px">No staff to show.</td></tr>
    @endforelse
    </tbody>
</table>
</body>
</html>
