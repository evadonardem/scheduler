<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AcademicYearScheduleFullDetailsResource;
use App\Http\Resources\SubjectClassResource;
use App\Http\Resources\SubjectResource;
use App\Http\Resources\UserResource;
use App\Models\AcademicYearSchedule;
use App\Models\SubjectClass;
use App\Services\AcademicYearScheduleService;
use App\Services\RoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicYearScheduleController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService,
        protected RoomService $roomService
    ) {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, AcademicYearSchedule $academicYearSchedule)
    {
        $filterDepartmentId = $request->input('filters.department.id');
        
        $rooms = collect();
        if ($filterDepartmentId) {
            $rooms = $this->roomService->getRooms(['department_id' => $filterDepartmentId]);
        }

        $scheduledSubjectClasses = SubjectClass::from('subject_classes AS sc')
            ->join(DB::raw("JSON_TABLE(
                sc.schedule,
                '\$.days[*]' COLUMNS (
                    resource_id INT PATH '\$.resource_id',
                    start_time JSON PATH '\$.start_time'
                )
            ) AS jt"), function ($join) use ($rooms) {
                $join->where('jt.resource_id', '>', 0);
                $join->whereNotNull('jt.start_time');
                if ($rooms->isNotEmpty()) {
                    $join->whereIn('jt.resource_id', $rooms->pluck('id'));
                }
            })
            ->where('sc.academic_year_schedule_id', $academicYearSchedule->id)
            ->with([
                'assignedTo.departments',
                'subject.department',
            ])
            ->select('sc.*')
            ->groupBy('sc.id')
            ->get();
        
        $plottableWeek = $this->academicYearScheduleService->getPlottableWeek($academicYearSchedule);
        $baseDate = $plottableWeek['start'];

        $dayStrings = fn (int $val) => match ($val) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',            
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        };

        $scheduledEvents = collect();

        $scheduledSubjectClasses->map(function ($subjectClass, $index) use ($baseDate, $dayStrings) {
            $days = array_map(function ($day) use ($subjectClass, $baseDate, $dayStrings, $index) {
                $dayString = $dayStrings($day['day']);
                $start = $baseDate->clone();

                $durationInHours = $day['duration_in_hours'] ?? 0;
                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);
                $subject = $subjectClass->subject;
                $assignedTo = $subjectClass->assignedTo;
                $assignedToFullName = "$assignedTo->last_name, $assignedTo->first_name";

                return [
                    'id' => $subjectClass->id,
                    'title' => "$subjectClass->code - $subject->code - BSIT 1 (Block A) - $assignedToFullName",
                    'color' => '#' . substr(md5($subjectClass->code), 0, 6),
                    'start' => $start->format('Y-m-d H:i:s'),
                    'end' => $start->copy()->addHours($durationInHours)->format('Y-m-d H:i:s'),
                    'resourceId' => $day['resource_id'],
                    'instanceId' => $index,
                    'subjectClass' => SubjectClassResource::make($subjectClass),
                ];
            }, $subjectClass->schedule['days']);

            return $days;
        })->each(function ($subjectClassEvents) use (&$scheduledEvents) {
            $scheduledEvents = $scheduledEvents->merge($subjectClassEvents);
        });

        $scheduledSubjectIds = $scheduledSubjectClasses->pluck('subject')->pluck('id')->unique()->toArray();
        $academicYearSchedule->load([
            'subjectClasses' => function ($query) use ($filterDepartmentId, $scheduledSubjectIds) {
                $query->withWhereHas('subject', function ($query) use ($filterDepartmentId, $scheduledSubjectIds) {
                    if ($filterDepartmentId) {
                        $query
                            ->where('department_id', $filterDepartmentId)
                            ->orWhereIn('id', $scheduledSubjectIds);
                    }
                });
            }
        ]);

        $unscheduledSubjectClasses = $academicYearSchedule->subjectClasses->filter(function ($subjectClass) {
            if (is_null($subjectClass->schedule)) {
                return true;
            }

            $isScheduled = true;
            foreach ($subjectClass->schedule['days'] as $day) {
                $isScheduled = $isScheduled && !!$day['start_time'] && !!$day['resource_id'];
            }

            return !$isScheduled;
        })->values();

        return AcademicYearScheduleFullDetailsResource::make($academicYearSchedule)->additional([
            'meta' => [
                'scheduledEvents' => $scheduledEvents,
                'unscheduledSubjectClasses' => SubjectClassResource::collection($unscheduledSubjectClasses),
            ],
        ]);
    }
}
