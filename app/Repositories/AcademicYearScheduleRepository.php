<?php

namespace App\Repositories;

use App\Models\AcademicYearSchedule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AcademicYearScheduleRepository
{
    public function __construct(
        protected AcademicYearSchedule $academicYearSchedule,
    ) {}

    public function create($data): AcademicYearSchedule
    {
        return $this->academicYearSchedule->create($data);
    }

    public function getAll(?int $perPage = null): Collection|LengthAwarePaginator
    {
        return $this->academicYearSchedule->newQuery()
            ->withCount('subjectClasses')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester_id', 'desc')
            ->paginate($perPage);
    }

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearSchedule
            ->where('is_active', true)
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester_id', 'desc')
            ->first();
    }
}
