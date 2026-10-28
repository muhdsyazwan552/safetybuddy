@if(!empty($list))
<h2>{{ $heading ?? 'Photos' }}</h2>
<table class="photos" width="100%">
@foreach(array_chunk($list, 2) as $row)
<tr>
@foreach($row as $p)<td width="50%"><img src="{{ $p }}"></td>@endforeach
@if(count($row) < 2)<td></td>@endif
</tr>
@endforeach
</table>
@endif
