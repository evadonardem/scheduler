<?php

namespace App\Services;

use App\Models\AcademicYearSchedule;
use App\Repositories\AcademicYearScheduleRepository;
use Carbon\Carbon;

class AcademicYearScheduleService
{
    public function __construct(
        protected AcademicYearScheduleRepository $academicYearScheduleRepository,
    ) {}

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearScheduleRepository->getLatestActiveAcademicYearSchedule();
    }

    public function getPlottableWeek(AcademicYearSchedule $academicYearSchedule): array{
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
