<?php

namespace App\Repositories;

use App\Models\AcademicYearSchedule;

class AcademicYearScheduleRepository
{
    public function __construct(
        protected AcademicYearSchedule $academicYearSchedule,
    ) {}

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearSchedule
            ->where('is_active', true)
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester_id', 'desc')
            ->first();
    }
}
