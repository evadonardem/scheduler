<?php

namespace App\Services;

use App\Models\AcademicYearSchedule;
use App\Repositories\AcademicYearScheduleRepository;

class AcademicYearScheduleService
{
    public function __construct(
        protected AcademicYearScheduleRepository $academicYearScheduleRepository,
    ) {}

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearScheduleRepository->getLatestActiveAcademicYearSchedule();
    }
}
