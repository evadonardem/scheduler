<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurriculumOfferingsResource;
use App\Http\Resources\SemesterResource;
use App\Http\Resources\SubjectClassResource;
use App\Models\AcademicYearSchedule;
use App\Models\Curriculum;
use App\Models\SubjectClass;
use App\Services\AcademicYearScheduleService;
use App\Services\RoomService;
use App\Services\SemesterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AcademicYearScheduleCurriculumOfferingController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected RoomService $roomService,
        protected SemesterService $semesterService
    ) {}

    public function index(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Curriculum $curriculum
    ) {
        $authUser = Auth::user();
        $authUserRoles = $authUser->roles->pluck('name');

        $semestersKeyById = $this->semesterService->getSemesters()->keyBy('id');
        $rooms = $this->roomService->getRooms([])->keyBy('id');
        $plottableWeek = $this->academicYearScheduleService->getPlottableWeek($academicYearSchedule);
        $baseDate = $plottableWeek['start'];

        $dayStrings = fn (int $val) => match ($val) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            0 => 'Sunday',
        };

        $subjectClassesQuery = $academicYearSchedule
            ->subjectClasses()
            ->where('academic_year_schedule_id', $academicYearSchedule->id)
            ->whereHas('curriculumSubject', function ($query) use ($curriculum) {
                $query->where('curriculum_id', $curriculum->id);
            });

        if (! $authUserRoles->contains(fn ($role) => in_array($role, ['Super Admin', 'Dean', 'Associate Dean', 'HR Admin']))) {
            $subjectClassesQuery->where('assigned_to_user_id', $authUser->id);
        }

        $subjectClasses = $subjectClassesQuery->get();

        $groupByYearLevel = $subjectClasses->groupBy('curriculumSubject.year_level')->values();
        $groupByYearLevel = $groupByYearLevel->map(function ($subjectClassesByYearLevel) use ($baseDate, $dayStrings, $rooms, $semestersKeyById) {
            $yearLevel = $subjectClassesByYearLevel->pluck('curriculumSubject.year_level')->unique()->first();
            $sectionsBySemester = $subjectClassesByYearLevel
                ->groupBy(fn ($subjectClass) => $subjectClass->section.'-'.$subjectClass->curriculumSubject->semester_id)
                ->map(function ($subjectClassesBySection) use ($baseDate, $dayStrings, $rooms, $semestersKeyById) {
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

                    $scheduled = $scheduled->map(function ($subjectClass) use ($baseDate, $dayStrings, $rooms) {
                        $days = collect($subjectClass->schedule['days']);
                        $scheduleDays = $days->map(function ($day) use ($baseDate, $dayStrings) {

                            $dayString = $dayStrings($day['day']);
                            $start = $baseDate->clone();

                            $durationInHours = $day['duration_in_hours'] ?? 0;
                            $start = $start->is($dayString) ? $start : $start->next($dayString);
                            $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);

                            return [
                                'day' => $dayString,
                                'time' => $start->format('h:i A').' to '.$start->copy()->addHours($durationInHours)->format('h:i A'),
                                'resourceId' => $day['resource_id'],
                            ];
                        });

                        $schedule = $scheduleDays->groupBy('resourceId')->map(function ($group) use ($rooms) {
                            $slots = [];

                            $group->each(function ($day) use (&$slots) {
                                $key = $day['time'].' - '.$day['resourceId'];
                                if (array_key_exists($key, $slots)) {
                                    $slots[$key]['days'][] = substr($day['day'], 0, 3);
                                    $slots[$key]['time'] = $day['time'];
                                } else {
                                    $slots[$key] = [
                                        'resourceId' => $day['resourceId'],
                                        'days' => [substr($day['day'], 0, 3)],
                                        'time' => $day['time'],
                                    ];
                                }
                            });

                            $slots = array_map(function ($slot) use ($rooms) {
                                return implode('/', $slot['days']).' - '.$slot['time'].' - '.$rooms[$slot['resourceId']]->code;
                            }, $slots);

                            return collect($slots);
                        })->flatten()->implode(' | ');

                        $subjectClass->schedule = $schedule;

                        return $subjectClass;
                    });

                    $semester = $semestersKeyById->get($subjectClassesBySection->pluck('curriculumSubject.semester_id')->unique()->first());

                    return (object) [
                        'id' => $subjectClassesBySection->pluck('section')->unique()->first(),
                        'semester' => SemesterResource::make($semester),
                        'subject_classes' => (object) [
                            'scheduled' => SubjectClassResource::collection($scheduled),
                            'unscheduled' => SubjectClassResource::collection($unscheduled),
                        ],
                    ];
                })
                ->groupBy('semester.id')
                ->map(function ($sectionsBySemester, $semesterId) use ($semestersKeyById) {
                    $semester = $semestersKeyById->get($semesterId);

                    return (object) [
                        'semester' => SemesterResource::make($semester),
                        'sections' => $sectionsBySemester,
                    ];
                })
                ->values();

            return (object) [
                'year_level' => $yearLevel,
                'semesters' => $sectionsBySemester,
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
        $semesterId = $request->input('semester_id');
        $maxSection = $academicYearSchedule
            ->subjectClasses()
            ->where('academic_year_schedule_id', $academicYearSchedule->id)
            ->whereHas('curriculumSubject', function ($query) use ($curriculum, $yearLevel) {
                $query->where('curriculum_id', $curriculum->id);
                $query->where('year_level', $yearLevel);
            })
            ->max('section');

        $subjects = $curriculum->subjects()
            ->wherePivot('semester_id', $semesterId)
            ->wherePivot('year_level', $yearLevel)
            ->get();

        $newSection = $maxSection + 1;
        $newSubjectClasses = $subjects->map(function ($subject) use ($academicYearSchedule, $newSection, $semesterId) {
            return [
                'code' => $subject->code.'-'.
                    substr(strtoupper(md5($academicYearSchedule->academic_year.$semesterId.$subject->id.now())), 0, 3),
                'academic_year_schedule_id' => $academicYearSchedule->id,
                'curriculum_subject_id' => $subject->pivot->id,
                'credit_hours' => $subject->pivot->credit_hours,
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
