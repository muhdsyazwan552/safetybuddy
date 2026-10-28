<h2>Inspection details</h2>
<table class="kv">
<tr><td class="k">Project</td><td class="v">{{ optional($i->project)->name ?: '-' }}</td></tr>
<tr><td class="k">Date</td><td class="v">{{ optional($i->inspection_date)->format('d M Y') ?: '-' }}</td></tr>
<tr><td class="k">Category</td><td class="v">{{ $category ?: '-' }}</td></tr>
<tr><td class="k">Topic</td><td class="v">{{ optional($i->topic)->code ? optional($i->topic)->code . ' - ' : '' }}{{ optional($i->topic)->name ?: '-' }}</td></tr>
<tr><td class="k">Subcontractor</td><td class="v">{{ optional($i->subconCompany)->name ?: '-' }}</td></tr>
<tr><td class="k">Location</td><td class="v">{{ $i->location ?: '-' }}</td></tr>
<tr><td class="k">Inspector</td><td class="v">{{ optional($i->inspector)->name ?: '-' }}</td></tr>
<tr><td class="k">Evaluation</td><td class="v"><span class="badge b-{{ $i->evaluation }}">{{ strtoupper($i->evaluation) }}</span></td></tr>
<tr><td class="k">Status</td><td class="v"><span class="badge b-approved">APPROVED</span></td></tr>
@if($i->non_conformance)<tr><td class="k">Non-conformance</td><td class="v">NC-{{ str_pad($i->non_conformance->id, 5, '0', STR_PAD_LEFT) }} ({{ $i->non_conformance->status }})</td></tr>@endif
@if($i->client_complaint)<tr><td class="k">Client complaint</td><td class="v">CC-{{ str_pad($i->client_complaint->id, 5, '0', STR_PAD_LEFT) }} ({{ $i->client_complaint->status }})</td></tr>@endif
</table>
<h2>Findings / description</h2>
<div class="box">{{ $i->description ?: 'No description.' }}</div>
@if($i->review_comment)<h2>Review comment</h2><div class="box">{{ $i->review_comment }}</div>@endif
@include('pdf._photos', ['list' => $photos])
