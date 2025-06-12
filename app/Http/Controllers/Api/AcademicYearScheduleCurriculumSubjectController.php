<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurriculumSubjectsResource;
use App\Http\Resources\SemesterResource;
use App\Http\Resources\SubjectResource;
use App\Models\AcademicYearSchedule;
use App\Models\Curriculum;
use App\Services\SemesterService;
use Illuminate\Http\Request;

class AcademicYearScheduleCurriculumSubjectController extends Controller
{
    public function __construct(
        protected SemesterService $semesterService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum
    ) {
        $subjects = $curriculum->subjects;
        $semestersKeyById = $this->semesterService->getSemesters()->keyBy('id');

        $academicYearScheduleSemesterId = $academicYearSchedule->semester_id;
        $subjectsByYearLevel = $subjects->groupBy('pivot.year_level')
            ->values()
            ->map(function ($subjectsByYearLevel) use ($academicYearScheduleSemesterId, $semestersKeyById) {
                $yearLevel = $subjectsByYearLevel->pluck('pivot.year_level')->unique()->first();
                $subjectsGroupedBySemester = $subjectsByYearLevel->groupBy('pivot.semester_id')
                    ->mapWithKeys(fn ($subjectsBySemester, $semesterId) => [
                        $semesterId => [
                            'semester' => SemesterResource::make($semestersKeyById->get($semesterId)),
                            'subjects' => SubjectResource::collection($subjectsBySemester),
                            'is_recommended' => $semesterId == $academicYearScheduleSemesterId,
                        ],
                    ])
                    ->sortBy('semester_id')
                    ->sortByDesc('is_recommended')
                    ->values();

                return (object) [
                    'year_level' => $yearLevel,
                    'semesters' => $subjectsGroupedBySemester,
                ];
            });

        return CurriculumSubjectsResource::collection($subjectsByYearLevel);
    }
}
