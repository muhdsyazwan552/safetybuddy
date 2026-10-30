<?php

namespace App\Models\Concerns;

use App\Support\SeriesCodes;

/** Gives a record a permanent per-company series code (serial_no + code) when it is first created. */
trait HasSeriesCode
{
    abstract public static function seriesType(): string;

    public static function bootHasSeriesCode(): void
    {
        static::creating(function ($model) {
            if ($model->code) {
                return;
            }
            [$model->serial_no, $model->code] = SeriesCodes::assignRecord(
                static::seriesType(),
                SeriesCodes::recordCompanyId(static::seriesType(), $model)
            );
        });
    }
}
