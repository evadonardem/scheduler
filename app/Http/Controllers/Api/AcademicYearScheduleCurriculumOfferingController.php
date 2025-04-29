<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurriculumOfferingsResource;
use App\Http\Resources\SubjectClassResource;
use App\Models\AcademicYearSchedule;
use App\Models\Curriculum;
use App\Models\SubjectClass;
use App\Services\AcademicYearScheduleService;
use App\Services\RoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AcademicYearScheduleCurriculumOfferingController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected RoomService $roomService
    ) {}

    public function index(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum
    ) {
        $authUser = Auth::user();
        $authUserRoles = $authUser->roles->pluck('name');

        $subjectClassesQuery = $academicYearSchedule
            ->subjectClasses()
            ->where('academic_year_schedule_id', $academicYearSchedule->id)
            ->whereHas('curriculumSubject', function ($query) use ($curriculum) {
                $query->where('curriculum_id', $curriculum->id);
            });

        if (! $authUserRoles->contains(fn ($role) => in_array($role, ['Super Admin', 'Dean', 'Associate Dean']))) {
            $subjectClassesQuery->where('assigned_to_user_id', $authUser->id);
        }

        $subjectClasses = $subjectClassesQuery->get();

        $groupByYearLevel = $subjectClasses->groupBy('curriculumSubject.year_level')->values();
        $groupByYearLevel = $groupByYearLevel->map(function ($subjectClassesByYearLevel) {
            $yearLevel = $subjectClassesByYearLevel->pluck('curriculumSubject.year_level')->unique()->first();
            $sections = $subjectClassesByYearLevel->groupBy('section')->map(function ($subjectClassesBySection) {
                $scheduled = $subjectClassesBySection->filter(function ($subjectClass) {
                    $schedule = $subjectClass->schedule;
                    $isAssigned = $subjectClass->assigned_to_user_id;
                    $isRoomAllocated = false;
                    if ($schedule) {
                        $days = collect($schedule['days']);
                        $isRoomAllocated = $days->pluck('resource_id')->filter()->isNotEmpty();
                    }

                    return $schedule && $isAssigned && $isRoomAllocated;
                })->values();
                $unscheduled = $subjectClassesBySection->diff($scheduled)->values();

                return (object) [
                    'id' => $subjectClassesBySection->pluck('section')->unique()->first(),
                    'subject_classes' => (object) [
                        'scheduled' => SubjectClassResource::collection($scheduled),
                        'unscheduled' => SubjectClassResource::collection($unscheduled),
                    ],
                ];
            })->values();

            return (object) [
                'year_level' => $yearLevel,
                'sections' => $sections,
            ];
        })->sortBy('year_level')->values();

        return CurriculumOfferingsResource::collection($groupByYearLevel);
    }

    public function store(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum
    ) {
        $yearLevel = $request->input('year_level');
        $maxSection = $academicYearSchedule
            ->subjectClasses()
            ->where('academic_year_schedule_id', $academicYearSchedule->id)
            ->whereHas('curriculumSubject', function ($query) use ($curriculum, $yearLevel) {
                $query->where('curriculum_id', $curriculum->id);
                $query->where('year_level', $yearLevel);
            })
            ->max('section');

        $subjects = $curriculum->subjects()
            ->wherePivot('semester_id', $academicYearSchedule->semester_id)
            ->wherePivot('year_level', $yearLevel)
            ->get();

        $newSection = $maxSection + 1;
        $newSubjectClasses = $subjects->map(function ($subject) use ($academicYearSchedule, $newSection) {
            return [
                'code' => $subject->code.'-'.
                    substr(strtoupper(md5($academicYearSchedule->academic_year.$academicYearSchedule->semester_id.$subject->id.now())), 0, 3),
                'academic_year_schedule_id' => $academicYearSchedule->id,
                'curriculum_subject_id' => $subject->pivot->id,
                'credit_hours' => $subject->pivot->units_lec + $subject->pivot->units_lab,
                'section' => $newSection,
                'is_block' => true,
            ];
        })->toArray();

        SubjectClass::insert($newSubjectClasses);

        return response()->noContent();
    }

    public function destroy(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum,
        SubjectClass $subjectClass
    ) {
        $subjectClass->delete();
        $yearLevel = $request->input('year_level');
        $section = $request->input('section');

        $academicYearSchedule
            ->subjectClasses()
            ->where('academic_year_schedule_id', $academicYearSchedule->id)
            ->whereHas('curriculumSubject', function ($query) use ($curriculum, $yearLevel) {
                $query->where('curriculum_id', $curriculum->id);
                $query->where('year_level', $yearLevel);
            })
            ->where('section', $section)
            ->delete();

        return response()->noContent();
    }
}
