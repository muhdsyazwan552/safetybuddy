<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A Supervisor / Manager response (or closing remark) on an incident. */
class IncidentResponse extends Model
{
    protected $table = 'incident_responses';

    protected $guarded = ['id'];
}
