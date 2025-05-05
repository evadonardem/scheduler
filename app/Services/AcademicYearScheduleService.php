<?php

namespace App\Services;

use App\Models\AcademicYearSchedule;
use App\Models\Department;
use App\Repositories\AcademicYearScheduleRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AcademicYearScheduleService
{
    public function __construct(
        protected AcademicYearScheduleRepository $academicYearScheduleRepository,
    ) {}

    public function createAcademicYearSchedule(array $data)
    {
        return $this->academicYearScheduleRepository->create($data);
    }

    public function getAllAcademicYearSchedules(?int $perPage = null): Collection|LengthAwarePaginator
    {
        return $this->academicYearScheduleRepository->getAll($perPage);
    }

    public function getFacultiesLoadUnits(AcademicYearSchedule $academicYearSchedule, Department $department, array $filters = []): Collection
    {
        return $this->academicYearScheduleRepository->getFacultyLoadUnits($academicYearSchedule->id, $department->id, $filters);
    }

    public function getFacultiesLoadSubjectClasses(AcademicYearSchedule $academicYearSchedule, Department $department, array $filters = []): Collection
    {
        return $this->academicYearScheduleRepository->getFacultyLoadSubjectClasses($academicYearSchedule->id, $department->id, $filters);
    }

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearScheduleRepository->getLatestActiveAcademicYearSchedule();
    }

    public function getPlottableWeek(AcademicYearSchedule $academicYearSchedule): array
    {
        $startDate = $academicYearSchedule->start_date;
        $endDate = $academicYearSchedule->end_date;

        $currentDate = $startDate->copy();
        $firstMonday = null;

        while ($currentDate <= $endDate) {
            if ($currentDate->isMonday()) {
                $firstMonday = $currentDate;
                break;
            }
            $currentDate->addDay();
        }

        return [
            'start' => $firstMonday,
            'end' => $firstMonday->copy()->addDays(6),
        ];
    }
}
