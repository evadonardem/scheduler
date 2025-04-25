<?php

namespace App\Http\Controllers;

use App\Services\AcademicYearScheduleService;
use App\Services\DepartmentService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected DepartmentService $departmentService
    ) {}

    public function index()
    {
        $academicYearSchedule = $this->academicYearScheduleService->getLatestActiveAcademicYearSchedule();

        return Inertia::render('Dashboard/Index', [
            'default_academic_year_schedule_id' => $academicYearSchedule?->id,
        ]);
    }
}
