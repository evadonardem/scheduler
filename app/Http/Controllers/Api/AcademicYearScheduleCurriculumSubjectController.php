<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurriculumSubjectsResource;
use App\Http\Resources\SubjectResource;
use App\Models\AcademicYearSchedule;
use App\Models\Curriculum;
use App\Services\AcademicYearScheduleService;
use App\Services\RoomService;
use Illuminate\Http\Request;

class AcademicYearScheduleCurriculumSubjectController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected RoomService $roomService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum
    ) {
        $subjects = $curriculum->subjects()->wherePivot('semester_id', $academicYearSchedule->semester_id)->get();

        $subjectsByYearLevel = $subjects->groupBy('pivot.year_level')->values()->map(function ($subjectsByYearLevel) {
            $yearLevel = $subjectsByYearLevel->pluck('pivot.year_level')->unique()->first();

            return (object) [
                'year_level' => $yearLevel,
                'subjects' => SubjectResource::collection($subjectsByYearLevel),
            ];
        });

        return CurriculumSubjectsResource::collection($subjectsByYearLevel);
    }
}
