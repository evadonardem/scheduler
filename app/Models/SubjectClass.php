<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectClass extends Model
{
    /** @use HasFactory<\Database\Factories\SubjectClassFactory> */
    use HasFactory;

    protected $casts = [
        'schedule' => 'json',
    ];

    public function academicYearSchedule(): BelongsTo
    {
        return $this->belongsTo(AcademicYearSchedule::class);
    }

    public function curriculumSubject(): BelongsTo
    {
        return $this->belongsTo(CurriculumSubject::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }
}
