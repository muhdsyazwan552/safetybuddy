<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** SPGPNC / BSPR configuration of one company. */
class PerformanceSetting extends Model
{
    protected $table = 'performance_settings';

    protected $guarded = ['id'];

    protected $casts = [
        'sp_benchmark' => 'float', 'g_benchmark' => 'float', 'p_benchmark' => 'float',
        'sp_penalty' => 'float', 'g_penalty' => 'float', 'p_penalty' => 'float',
        'nc_penalty' => 'float', 'cc_penalty' => 'float',
        'gold_min' => 'float', 'silver_min' => 'float',
        'scoring_on' => 'boolean', 'bspr_on' => 'boolean', 'penalties_on' => 'boolean',
    ];

    public const KEYS = [
        'sp_benchmark', 'g_benchmark', 'p_benchmark',
        'sp_penalty', 'g_penalty', 'p_penalty', 'nc_penalty', 'cc_penalty',
        'gold_min', 'silver_min', 'scoring_on', 'bspr_on', 'penalties_on',
    ];

    public static function forCompany($companyId): self
    {
        $row = static::firstOrCreate(['company_id' => $companyId]);

        // a freshly created row only holds company_id: load the column defaults
        return $row->wasRecentlyCreated ? $row->refresh() : $row;
    }

    /** Plain array copy that is stored with each report so later changes never rewrite old reports. */
    public function snapshot(): array
    {
        $defaults = \App\Support\Spgpnc::DEFAULTS;

        return collect(self::KEYS)->mapWithKeys(fn ($k) => [$k => $this->{$k} ?? $defaults[$k]])->all();
    }
}
