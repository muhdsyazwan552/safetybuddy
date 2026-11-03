<?php

namespace App\Models;

use App\Models\Concerns\HasSeriesCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manhour extends Model
{
    use HasFactory, HasSeriesCode;

    /** One daily attendance entry (project + subcontractor + day) gets a code such as ABC/ATT/001. */
    public static function seriesType(): string
    {
        return 'att';
    }

    protected $table = 'manhours';


    /** A signed-in company only ever sees its own rows. */

    protected static function booted(): void

    {

        static::addGlobalScope(new \App\Models\Scopes\TenantScope());
        static::saving(fn ($model) => \App\Models\Scopes\TenantScope::guardWrite($model));

    }

    protected $fillable = [
        'company_id',
        'project_id',
        'subcon_company_id',
        'work_date',
        'worker_count',
        'working_hours',
    ];

    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'worker_count' => 'integer',
        'working_hours' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function subcontractor()
    {
        return $this->belongsTo(SubconCompany::class, 'subcon_company_id');
    }
}
