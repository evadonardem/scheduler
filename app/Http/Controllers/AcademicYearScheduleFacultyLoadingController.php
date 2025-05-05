<?php

namespace App\Http\Controllers;

use App\Http\Resources\AcademicYearScheduleResource;
use App\Models\AcademicYearSchedule;
use App\Services\AcademicYearScheduleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicYearScheduleFacultyLoadingController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, AcademicYearSchedule $academicYearSchedule)
    {
        return Inertia::render('AcademicYearSchedule/FacultyLoading/List', [
            'academicYearSchedule' => AcademicYearScheduleResource::make($academicYearSchedule),
        ]);
    }
}
