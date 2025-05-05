<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubjectClassResource;
use App\Http\Resources\UserResource;
use App\Models\AcademicYearSchedule;
use App\Models\Department;
use App\Services\AcademicYearScheduleService;
use App\Services\RoomService;
use Illuminate\Http\Request;

class AcademicYearScheduleDepartmentLoadController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected RoomService $roomService,
    ) {}

    public function getFacultiesLoadUnits(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Department $department
    ) {
        $filters = $request->input('filters', []);

        return UserResource::collection($this->academicYearScheduleService->getFacultiesLoadUnits($academicYearSchedule, $department, $filters));
    }

    public function getFacultiesLoadSubjectClasses(
        Request $request,
        AcademicYearSchedule $academicYearSchedule,
        Department $department
    ) {
        $filters = $request->input('filters', []);

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

        $subjectClasses = $this->academicYearScheduleService->getFacultiesLoadSubjectClasses($academicYearSchedule, $department, $filters);
        $subjectClasses->map(function ($subjectClass, $index) use ($baseDate, $dayStrings, $rooms) {

            if (! $subjectClass->schedule) {
                $schedule = '(Day/Time/Room Not Set)';
            } else {
                $days = collect($subjectClass->schedule['days']);

                if ($days->contains('resource_id', null)) {
                    $schedule = $days->map(fn ($day) => substr($dayStrings($day['day']), 0, 3))->implode('/').' (Time/Room Not Set)';
                } else {
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
                }
            }

            $subjectClass->schedule = $schedule;

            return $subjectClass;
        });

        $subjectClasses = $subjectClasses->sort(function ($a, $b) {
            $sectionA = $a->curriculumSubject->curriculum->course->code.' '.
                $a->curriculumSubject->year_level.' '.($a->is_block ? 'Blk. ' : '').'Sec. '.$a->section;
            $sectionB = $b->curriculumSubject->curriculum->course->code.' '.
                $b->curriculumSubject->year_level.' '.($b->is_block ? 'Blk. ' : '').'Sec. '.$b->section;

            return $sectionA <=> $sectionB;
        });

        return SubjectClassResource::collection($subjectClasses);
    }
}
