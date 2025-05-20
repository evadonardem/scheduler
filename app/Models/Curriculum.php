<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Curriculum extends Model
{
    /** @use HasFactory<\Database\Factories\CurriculumFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'course_id',
        'is_draft',
        'is_active',
        'created_by',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class)
            ->withPivot([
                'id',
                'semester_id',
                'year_level',
                'units_lec',
                'units_lab',
                'credit_hours',
            ]);
    }
}
