<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProviderCertificate extends Model
{
    protected $fillable = ['application_id', 'issuing_body', 'expiry_date', 'file_path', 'file_name'];

    protected $casts = ['expiry_date' => 'date'];

    public function application()
    {
        return $this->belongsTo(TrainingProviderApplication::class, 'application_id');
    }
}
