<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Executor extends Model
{
    use HasFactory;

    protected $table = 'executor_companies';
  
    protected $fillable = [
        'name',
        'short_name',
        'email',
        'contact',
        'address',
        'status',
        'company_id'
    ];

    
 public function projects()
    {
        return $this->belongsToMany(
            Project::class,
            'executor_project_assign',
            'entity_id',    // FK on pivot table for executor
            'project_id'    // FK on pivot table for project
        )
        ->withPivot('role_assignment', 'entity_type')
        ->wherePivot('entity_type', 'CP') // Only company assignments
        ->using(ExecutorProjectAssign::class);
    }

    // Direct relationship with assignments
    public function assignments()
    {
        return $this->hasMany(ExecutorProjectAssign::class, 'entity_id')
                   ->where('entity_type', 'CP');
    }

    // Relationship with staff members
    public function staff()
    {
        return $this->hasMany(ExecutorStaff::class, 'executor_company_id');
    }
    /**
     * Generate a short name from the company name
     */
    public static function generateShortName($name)
    {
        // Common words to exclude
        $excludeWords = ['sdn', 'bhd', 'llp', 'plc', 'inc', 'co', 'ltd', 'pte', 'llc', 'corp', 'corporation', 'the', 'of', 'and'];
        
        // Remove punctuation and split into words
        $cleanName = preg_replace('/[^\w\s]/', '', $name);
        $words = preg_split('/\s+/', trim($cleanName));
        
        $shortName = '';
        $wordCount = 0;
        
        foreach ($words as $word) {
            $lowerWord = strtolower($word);
            if (!empty($word) && !in_array($lowerWord, $excludeWords)) {
                $shortName .= strtoupper(substr($word, 0, 1));
                $wordCount++;
                
                // Stop after 3 letters for long names
                if ($wordCount >= 3) {
                    break;
                }
            }
        }
        
        // Fallback if all words were excluded
        if (empty($shortName)) {
            $shortName = strtoupper(substr(preg_replace('/[^\w]/', '', $name), 0, 3));
        }
        
        return $shortName;
    }

    protected static function boot()
{
    parent::boot();

    static::creating(function ($model) {
        $model->short_name = static::generateShortName($model->name);
    });
}
}