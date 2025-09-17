<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExecutorStaff extends Model
{
    use HasFactory;

    protected $table = 'executor_companies_staff';

    protected $fillable = [
        'executor_company_id',
        'name',
        'role',
        'email',
        'contact',
        'status'
        
        
    ];

    public function company()
    {
        return $this->belongsTo(Executor::class, 'executor_company_id', 'id');
    }
}