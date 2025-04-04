<?php

use App\Http\Resources\AcademicYearScheduleFullDetailsResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\RoomResource;
use App\Models\AcademicYearSchedule;
use App\Models\Room;
use App\Models\SubjectClass;
use App\Services\AcademicYearScheduleService;
use App\Services\DepartmentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('scheduler', function () {
        $academicYearScheduleId = request()->input('academic_year_schedule_id');
        $academicYearScheduleService = app()->make(AcademicYearScheduleService::class);
        $departmentService = app()->make(DepartmentService::class);

        $filterDepartment = request()->input('filters.department');
        
        if ($academicYearScheduleId) {
            $academicYearSchedule = AcademicYearSchedule::find($academicYearScheduleId);
            if (!$academicYearSchedule) {
                return response()->json(['error' => 'Academic Year Schedule not found'], 404);
            }
        } else {
            $academicYearSchedule = $academicYearScheduleService->getLatestActiveAcademicYearSchedule();
            $academicYearSchedule->load([
                'subjectClasses' => function ($query) use ($filterDepartment) {
                    $query->withWhereHas('subject', function ($query) use ($filterDepartment) {
                        if ($filterDepartment) {
                            $query->where('department_id', $filterDepartment['id']);
                        } 
                    });
                }
            ]);
        }
        if (!$academicYearSchedule) {
            return response()->json(['error' => 'No active Academic Year Schedule found'], 404);
        }

        if ($filterDepartment) {
            $rooms = Room::where('default_owner_department_id', $filterDepartment['id'])
                ->orderBy('name')
                ->get();
        } else {
            $rooms = Room::orderBy('name')->get();
        }

        $departments = $departmentService->getDepartments();
        
        /**
         * prep all scheduled subject classes
         */
        $scheduledSubjectClasses = SubjectClass::from('subject_classes AS sc')
            ->join(DB::raw("JSON_TABLE(
                sc.schedule,
                '\$.days[*]' COLUMNS (
                    resource_id INT PATH '\$.resource_id',
                    start_time JSON PATH '\$.start_time'
                )
            ) AS jt"), function($join) {
                $join->where('jt.resource_id', '>', 0);
                $join->whereNotNull('jt.start_time');
            })
            ->select('sc.*')
            ->groupBy('sc.id')
            ->get();
        
        $academicYearScheduleService = app()->make(AcademicYearScheduleService::class);
        $plottableWeek = $academicYearScheduleService->getPlottableWeek($academicYearSchedule);
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

        $scheduledSubjectClasses->map(function ($subjectClass) use ($baseDate, $dayStrings) {
            $days = array_map(function ($day) use ($subjectClass, $baseDate, $dayStrings) {
                $dayString = $dayStrings($day['day']);
                $start = $baseDate->clone();

                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);

                $perSessionDuration = $subjectClass->schedule['per_session_duration'];

                return [
                    'id' => $subjectClass->id,
                    'title' => $subjectClass->code,
                    'color' => '#' . substr(md5($subjectClass->code), 0, 6),
                    'start' => $start->format('Y-m-d H:i:s'),
                    'end' => $start->copy()->addHours($perSessionDuration)->format('Y-m-d H:i:s'),
                    'resourceId' => $day['resource_id'],
                ];
            }, $subjectClass->schedule['days']);

            return $days;
        })->each(function ($subjectClassEvents) use (&$scheduledEvents) {
            $scheduledEvents = $scheduledEvents->merge($subjectClassEvents);
        });

        return AcademicYearScheduleFullDetailsResource::make($academicYearSchedule)->additional([
            'meta' => [
                'departments' => DepartmentResource::collection($departments),
                'rooms' => RoomResource::collection($rooms),
                'scheduledEvents' => $scheduledEvents,
            ],
        ]);
    });

    Route::patch('subject-classes/{subjectClass}/schedule', function (SubjectClass $subjectClass) {
        $relatedRoomIds = collect(request()->input('schedule.days'))->pluck('resource_id')->unique()->toArray();
        $relatedSubjectClasses = SubjectClass::where('academic_year_schedule_id', $subjectClass->academic_year_schedule_id)
            ->where(function ($query) use ($relatedRoomIds) {
                foreach ($relatedRoomIds as $relatedRoomId) {
                    $query->orWhereJsonContains('schedule->days', [
                        'resource_id' => $relatedRoomId
                    ]);   
                }
            })
            ->get();

        $dayStrings = fn (int $val) => match ($val) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',            
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        }; 

        $occupiedSlots = collect();
        foreach ($relatedSubjectClasses as $relatedSubjectClass) {
            $perSessionDuration = $relatedSubjectClass->schedule['per_session_duration'];
            foreach ($relatedSubjectClass->schedule['days'] as $day) {
                $dayString = $dayStrings($day['day']); 
                $start = Carbon::now();
                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);
                $occupiedSlots->push([
                    'start' => $start,
                    'end' => $start->copy()->addHours($perSessionDuration),
                    'resource_id' => $day['resource_id'],
                ]);
            }
        }

        $perSessionDuration = request()->input('schedule.per_session_duration');
        $days = request()->input('schedule.days');
        foreach ($days as $day) {
            $start = Carbon::now();
            $start = $start->is($dayStrings($day['day'])) ? $start : $start->next($dayStrings($day['day']));
            $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(1);
            $end = $start->copy()->addHours($perSessionDuration);
            $resourceId = $day['resource_id'];

            $overlaps = $occupiedSlots->contains(function ($occupiedSlot) use ($start, $end, $resourceId) {
                
                $sameResource = $occupiedSlot['resource_id'] == $resourceId;

                $startConflict = $start->between($occupiedSlot['start'], $occupiedSlot['end']);
                $endConflictCase1 = $end->subSeconds(1) != $occupiedSlot['start'] && $end->between($occupiedSlot['start'], $occupiedSlot['end']);
                $endConflictCase2 = $end->greaterThanOrEqualTo($occupiedSlot['end']) && $occupiedSlot['end']->between($start, $end);
                $endConflict = $endConflictCase1 || $endConflictCase2;
                
                return $sameResource && ($startConflict || $endConflict);
            });

            if ($overlaps) {
                return response()->json(['error' => 'Conflicting schedule.'], 422);
            }
        }

        $subjectClass->schedule = request()->input('schedule');
        $subjectClass->save();

        response()->noContent();
    });
});
