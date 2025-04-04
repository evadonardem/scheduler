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
        return Inertia::render('Dashboard/Index', []);
    }
}
