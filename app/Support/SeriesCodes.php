<?php

namespace App\Support;

use App\Models\Company;
use App\Models\CompanyStaff;
use App\Models\SubconCompany;
use App\Models\SubconStaff;
use App\Models\SubscriptionsCompany;
use App\Models\Inspection;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Stable, human-readable codes. A code never changes when a name is edited. */
class SeriesCodes
{
    public static function prefix(string $name): string
    {
        $tokens = preg_split('/[^A-Za-z0-9]+/', Str::ascii($name), -1, PREG_SPLIT_NO_EMPTY);
        $tokens = array_values(array_filter($tokens, fn ($token) => !in_array(strtoupper($token), [
            'SDN', 'BHD', 'BERHAD', 'SYKT', 'SYARIKAT', 'LTD', 'LLC', 'INC', 'CO', 'COMPANY', 'THE',
        ], true)));

        if (!$tokens) {
            return 'CO';
        }

        // Keep a recognizable acronym at the start of names such as "XYZ Electrical".
        if (preg_match('/^[A-Z0-9]{2,4}$/', $tokens[0])) {
            return $tokens[0];
        }

        return substr(strtoupper(implode('', array_map(fn ($token) => $token[0], $tokens))), 0, 6);
    }

    public static function number(int $sequence): string
    {
        return str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }

    /** Record types that carry a per-company series code: scope key => code segment. */
    public const RECORD_SEGMENTS = ['tbx' => 'TBX', 'ins' => 'INS', 'nc' => 'NC', 'cc' => 'CC', 'inc' => 'INC', 'att' => 'ATT'];

    /** Company that owns a toolbox talk / inspection / NC / CC row, resolved through its project or inspection. */
    public static function recordCompanyId(string $type, $row): ?int
    {
        if (in_array($type, ['nc', 'cc'], true)) {
            $inspection = $row->inspection_id ? Inspection::find($row->inspection_id) : null;

            return $inspection ? self::recordCompanyId('ins', $inspection) : null;
        }
        if (in_array($type, ['ins', 'inc', 'att'], true) && $row->company_id) {
            return (int) $row->company_id;
        }
        $companyId = $row->project_id ? Project::whereKey($row->project_id)->value('company_id') : null;

        return $companyId ? (int) $companyId : null;
    }

    /** Next [serial_no, code] for a record type, e.g. ABC/TBX/001. The counter row lock keeps concurrent creates unique. */
    public static function assignRecord(string $type, ?int $companyId): array
    {
        return DB::transaction(function () use ($type, $companyId) {
            $companyCode = $companyId ? Company::whereKey($companyId)->value('code') : null;
            $sequence = self::next("{$type}:" . (int) $companyId);

            return [$sequence, ($companyCode ?: 'CO') . '/' . self::RECORD_SEGMENTS[$type] . '/' . self::number($sequence)];
        });
    }

    private static function next(string $scope): int
    {
        DB::table('series_code_counters')->insertOrIgnore(['scope' => $scope, 'next_number' => 1]);
        $counter = DB::table('series_code_counters')->where('scope', $scope)->lockForUpdate()->first();
        DB::table('series_code_counters')->where('scope', $scope)->update(['next_number' => $counter->next_number + 1]);

        return (int) $counter->next_number;
    }

    public static function createCompany(array $attributes): Company
    {
        return DB::transaction(function () use ($attributes) {
            DB::table('series_code_counters')->where('scope', 'company')->lockForUpdate()->first();

            $base = self::prefix($attributes['name']);
            $candidate = $base;
            $suffix = 2;
            while (Company::where('code', $candidate)->exists()) {
                $candidate = $base . $suffix++;
            }

            return Company::create(array_merge($attributes, ['code' => $candidate]));
        });
    }

    public static function createEmployee(int $companyId, array $attributes): CompanyStaff
    {
        return DB::transaction(function () use ($companyId, $attributes) {
            $company = Company::whereKey($companyId)->firstOrFail();
            $sequence = self::next("employee:{$companyId}");

            return CompanyStaff::create(array_merge($attributes, [
                'company_id' => $companyId,
                'serial_no' => $sequence,
                'code' => $company->code . '/EMP/' . self::number($sequence),
            ]));
        });
    }

    public static function createSubscription(int $companyId, array $attributes): SubscriptionsCompany
    {
        return DB::transaction(function () use ($companyId, $attributes) {
            $company = Company::whereKey($companyId)->firstOrFail();
            $sequence = self::next("subscription:{$companyId}");

            return SubscriptionsCompany::create(array_merge($attributes, [
                'company_id' => $companyId,
                'serial_no' => $sequence,
                'code' => ($company->code ?: 'CO') . '/SUB/' . self::number($sequence),
            ]));
        });
    }

    public static function createSubconCompany(int $ownerId, array $attributes): SubconCompany
    {
        return DB::transaction(function () use ($ownerId, $attributes) {
            $owner = Company::whereKey($ownerId)->firstOrFail();
            $prefix = self::prefix($attributes['name']);
            $sequence = self::next("subcon:{$ownerId}:{$prefix}");

            return SubconCompany::create(array_merge($attributes, [
                'company_id' => $ownerId,
                'code_prefix' => $prefix,
                'serial_no' => $sequence,
                'code' => $owner->code . '/' . $prefix . '/' . self::number($sequence),
            ]));
        });
    }

    public static function createSubconStaff(int $subconId, array $attributes): SubconStaff
    {
        return DB::transaction(function () use ($subconId, $attributes) {
            $subcon = SubconCompany::whereKey($subconId)->firstOrFail();
            $sequence = self::next("staff:{$subconId}");

            return SubconStaff::create(array_merge($attributes, [
                'company_id' => $subconId,
                'status' => 'pending', // becomes active once the briefing evidence is approved
                'sp_briefing_status' => 'pending',
                'serial_no' => $sequence,
                'code' => $subcon->code . '/STF/' . self::number($sequence),
            ]));
        });
    }
}
