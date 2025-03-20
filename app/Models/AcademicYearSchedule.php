<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYearSchedule extends Model
{
    /** @use HasFactory<\Database\Factories\AcademicYearScheduleFactory> */
    use HasFactory;

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function subjectClasses(): HasMany
    {
        return $this->hasMany(SubjectClass::class);
    }
}
