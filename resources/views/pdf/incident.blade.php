@extends('pdf.layout')
@section('body')
<h2>Incident details</h2>
<table class="kv">
<tr><td class="k">Date &amp; time</td><td class="v">{{ optional($i->incident_date)->format('d M Y, H:i') ?: '-' }}</td></tr>
<tr><td class="k">Project</td><td class="v">{{ optional($i->project)->name ?: '-' }}</td></tr>
<tr><td class="k">Subcontractor</td><td class="v">{{ optional($i->subcontractor)->name ?: '-' }}</td></tr>
<tr><td class="k">Incident type</td><td class="v">{{ optional($i->incidentType)->name ?: '-' }}</td></tr>
<tr><td class="k">Injury type</td><td class="v">{{ optional($i->injuryType)->name ?: '-' }}</td></tr>
<tr><td class="k">Body part</td><td class="v">{{ $i->body_part ?: '-' }}</td></tr>
<tr><td class="k">Location</td><td class="v">{{ $i->location ?: '-' }}</td></tr>
<tr><td class="k">Reported by</td><td class="v">{{ optional($i->reportedBy)->name ?: '-' }}</td></tr>
<tr><td class="k">Responsible person</td><td class="v">{{ optional($i->responsibleBy)->name ?: '-' }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-{{ strtolower($i->status ?: 'open') }}">{{ strtoupper($i->status ?: 'open') }}</span></td></tr>
@if($i->lti_worker_count || $i->lti_days_lost)
<tr><td class="k">LTI workers / days lost</td><td class="v">{{ (int) $i->lti_worker_count }} / {{ (int) $i->lti_days_lost }}</td></tr>
<tr><td class="k">Man-hours lost</td><td class="v">{{ (int) ($i->manhours_lost ?: $i->lti_man_hours_lost) }}</td></tr>
@endif
</table>
@if($i->involvedStaff->count())
<h2>Persons involved</h2>
<table class="grid"><tr><th width="30">#</th><th>Name</th><th>Role</th></tr>
@foreach($i->involvedStaff as $n => $p)<tr><td>{{ $n + 1 }}</td><td>{{ $p->name }}</td><td>{{ $p->role ?: '-' }}</td></tr>@endforeach
</table>
@endif
<h2>Description</h2><div class="box">{{ $i->incident_description ?: '-' }}</div>
<h2>Immediate cause</h2><div class="box">{{ $i->immediate_cause ?: '-' }}</div>
<h2>Underlying cause</h2><div class="box">{{ $i->underlying_cause ?: '-' }}</div>
<h2>Immediate action</h2><div class="box">{{ $i->immediate_action ?: '-' }}</div>
<h2>Corrective action</h2><div class="box">{{ $i->corrective ?: '-' }}</div>
@if($i->responses->count())
<h2>Review log</h2>
<table class="grid"><tr><th width="85">When</th><th width="90">By</th><th width="55">Type</th><th>Message</th></tr>
@foreach($i->responses as $r)<tr><td>{{ optional($r->created_at)->format('d M Y H:i') }}</td><td>{{ $r->staff_name }}@if($r->role_label)<br><span class="muted">{{ $r->role_label }}</span>@endif</td><td>{{ $r->type }}</td><td>{{ $r->message }}</td></tr>@endforeach
</table>
@endif
@include('pdf._photos', ['list' => array_values(array_filter([$attachment])), 'heading' => 'Attachment'])
@endsection
