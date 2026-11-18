<div class="sign">
    <table><tr>
        <td><div class="line"></div><div class="role">Created by</div><div class="nm">{{ $createdBy }}</div><div class="dt">{{ $createdRole }}<br>{{ $createdAt }}</div></td>
        <td><div class="line"></div><div class="role">Supervisor (Tier 2)</div><div class="nm">{{ $supervisor['name'] ?: '-' }}</div><div class="dt">Date: {{ $supervisor['at'] ?: '-' }}</div></td>
        <td><div class="line"></div><div class="role">Manager (Tier 3)</div><div class="nm">{{ $manager['name'] ?: '-' }}</div><div class="dt">Date: {{ $manager['at'] ?: '-' }}</div></td>
    </tr></table>
</div>
