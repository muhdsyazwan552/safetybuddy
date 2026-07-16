<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manhour extends Model
{
    use HasFactory;

    protected $table = 'manhours';

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
