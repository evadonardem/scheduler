<?php

namespace App\Http\Controllers;

use App\Http\Resources\AcademicYearScheduleFullDetailsResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\RoomResource;
use App\Models\Room;
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
        $filteredDepartmentId = request()->input('filters.department');
        $departments = $this->departmentService->getDepartments();

        $academicYearSchedule = $this->academicYearScheduleService->getLatestActiveAcademicYearSchedule();

        if ($filteredDepartmentId) {
            $rooms = Room::where('default_owner_department_id', $filteredDepartmentId)->get();
        } else {
            $rooms = Room::all();
        }

        return Inertia::render('Dashboard/Index', [
            'academicYearSchedule' => $academicYearSchedule
                ? AcademicYearScheduleFullDetailsResource::make($academicYearSchedule)
                : null,
            'currFilters' => request()->input('filters'),
            'departments' => DepartmentResource::collection($departments),
            'rooms' => RoomResource::collection($rooms),
        ]);
    }
}
