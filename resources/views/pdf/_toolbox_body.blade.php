<h2>Toolbox talk details</h2>
<table class="kv">
<tr><td class="k">Project</td><td class="v">{{ optional($t->project)->name ?: '-' }}</td></tr>
<tr><td class="k">Date</td><td class="v">{{ optional($t->inspection_date)->format('d M Y') ?: '-' }}</td></tr>
<tr><td class="k">Conducted by</td><td class="v">{{ optional($t->CompanyStaff)->name ?: '-' }}</td></tr>
<tr><td class="k">Conducted</td><td class="v">{{ $t->conducted === 'yes' ? 'Yes' : 'No' }}</td></tr>
<tr><td class="k">Total attended</td><td class="v">{{ (int) $t->total_attended }}</td></tr>
<tr><td class="k">Categories</td><td class="v">{{ $t->categories->pluck('name')->implode(', ') ?: '-' }}</td></tr>
@if($t->topics->count())<tr><td class="k">Topics</td><td class="v">{{ $t->topics->pluck('name')->implode(', ') }}</td></tr>@endif
<tr><td class="k">Safety Passport sampled</td><td class="v">{{ $t->sp_sampled ?? '-' }}</td></tr>
<tr><td class="k">Not registered</td><td class="v">{{ $t->sp_not_registered ?? '-' }}</td></tr>
<tr><td class="k">SP compliance</td><td class="v">{{ $t->sp_compliance !== null ? $t->sp_compliance . '%' : '-' }}</td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-approved">APPROVED</span></td></tr>
</table>
<h2>Attendees ({{ $t->attendees->count() }})</h2>
@if($t->attendees->count())
<table class="grid"><tr><th width="30">#</th><th>Name</th><th>Role</th></tr>
@foreach($t->attendees as $n => $a)<tr><td>{{ $n + 1 }}</td><td>{{ $a->name }}</td><td>{{ $a->role ?: '-' }}</td></tr>@endforeach
</table>
@else<div class="muted">No attendee list recorded.</div>@endif
@if($t->inspections->count())
<h2>Inspections in this visit ({{ $t->inspections->count() }})</h2>
<table class="grid"><tr><th>Topic</th><th>Subcontractor</th><th>Evaluation</th></tr>
@foreach($t->inspections as $x)<tr><td>{{ optional($x->topic)->name ?: '-' }}</td><td>{{ optional($x->subconCompany)->name ?: '-' }}</td><td>{{ strtoupper($x->evaluation) }}</td></tr>@endforeach
</table>
@endif
@if($t->review_comment)<h2>Review comment</h2><div class="box">{{ $t->review_comment }}</div>@endif
@include('pdf._photos', ['list' => array_values(array_filter([$imgGroup, $imgAttendance])), 'heading' => 'Group photo and attendance sheet'])
