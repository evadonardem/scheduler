<?php

use App\Http\Controllers\Api\AcademicYearScheduleController;
use App\Http\Controllers\Api\AcademicYearScheduleCurriculumOfferingController;
use App\Http\Controllers\Api\AcademicYearScheduleCurriculumSubjectController;
use App\Http\Controllers\Api\AcademicYearScheduleDepartmentLoadController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CurriculumController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\UserController;
use App\Models\AcademicYearSchedule;
use App\Models\SubjectClass;
use App\Services\AcademicYearScheduleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    $routes = Route::getRoutes();
    $routeList = [];
    foreach ($routes as $route) {
        // Check if the URI starts with 'api'
        if (strpos($route->uri, 'api/') === 0) {
            $routeList[] = [
                'method' => $route->methods(),
                'uri' => $route->uri,
                'name' => $route->getName(),
                'action' => $route->getActionName(),
            ];
        }
    }

    return response()->json([
        'name' => config('app.name').' API',
        'routes' => $routeList,
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::group(['middleware' => ['auth:sanctum']], function () {
    /**
     * check academic year schedules available open for scheduling
     */
    Route::get('scheduler-is-open', function () {
        $academicYearScheduleService = app()->make(AcademicYearScheduleService::class);
        $academicYearSchedule = $academicYearScheduleService->getLatestActiveAcademicYearSchedule();

        return response()->noContent($academicYearSchedule ? 204 : 404);
    });

    /**
     * find schedule availability by academic year and semester
     */
    Route::get('find-schedule/{academicYear}/{semesterId}', function (string $academicYear, int $semesterId) {
        $academicYearSchedule = AcademicYearSchedule::where([
            'academic_year' => $academicYear,
            'semester_id' => $semesterId,
        ])->first();

        if (! $academicYearSchedule) {
            abort(404);
        }

        return response()->json([
            'data' => [
                'id' => $academicYearSchedule->id,
            ],
        ]);
    });

    Route::patch('subject-classes/{subjectClass}', function (SubjectClass $subjectClass) {
        $assignedToUserId = request()->input('assigned_to_user_id');

        $subjectClass->assigned_to_user_id = $assignedToUserId;
        $subjectClass->save();

        return response()->noContent();
    });

    Route::patch('subject-classes/{subjectClass}/schedule', function (SubjectClass $subjectClass) {
        $relatedRoomIds = collect(request()->input('schedule.days'))->pluck('resource_id')->unique()->filter()->toArray();

        // unschededuled subject class
        if (empty($relatedRoomIds)) {
            $subjectClass->schedule = request()->input('schedule');
            $subjectClass->save();

            return response()->noContent();
        }

        $relatedSubjectClasses = SubjectClass::where('academic_year_schedule_id', $subjectClass->academic_year_schedule_id)
            ->where(function ($query) use ($relatedRoomIds) {
                foreach ($relatedRoomIds as $relatedRoomId) {
                    $query->orWhereJsonContains('schedule->days', [
                        'resource_id' => $relatedRoomId,
                    ]);
                }
            })
            ->where('id', '!=', $subjectClass->id)
            ->get();

        $assignedToUserSubjectClasses = SubjectClass::from('subject_classes AS sc')
            ->join(DB::raw("JSON_TABLE(
                sc.schedule,
                '\$.days[*]' COLUMNS (
                    resource_id INT PATH '\$.resource_id',
                    start_time JSON PATH '\$.start_time'
                )
            ) AS jt"), function ($join) {
                $join->where('jt.resource_id', '>', 0);
                $join->whereNotNull('jt.start_time');
            })
            ->where([
                'academic_year_schedule_id' => $subjectClass->academic_year_schedule_id,
                'assigned_to_user_id' => $subjectClass->assigned_to_user_id,
            ])
            ->where('id', '!=', $subjectClass->id)
            ->select('sc.*')
            ->groupBy('sc.id')
            ->get();

        $section = $subjectClass->section;
        $subject = $subjectClass->curriculumSubject->subject;
        $curriculum = $subjectClass->curriculumSubject->curriculum;
        $subjectUnderCurriculum = $curriculum->subjects()->where(function ($query) use ($subject) {
            $relationTable = $query->getModel()->getTable();
            $query->where("$relationTable.id", $subject->id);
        })->first();
        $relatedSubjectClassesByBlockSection = SubjectClass::join(DB::raw("JSON_TABLE(
                subject_classes.schedule,
                '\$.days[*]' COLUMNS (
                    resource_id INT PATH '\$.resource_id',
                    start_time JSON PATH '\$.start_time'
                )
            ) AS jt"), function ($join) {
            $join->where('jt.resource_id', '>', 0);
            $join->whereNotNull('jt.start_time');
        })
            ->whereHas('assignedTo')
            ->whereHas('curriculumSubject.curriculum.subjects', function ($query) use ($subjectUnderCurriculum) {
                $query->where([
                    'curriculum_id' => $subjectUnderCurriculum->pivot->curriculum_id,
                    'semester_id' => $subjectUnderCurriculum->pivot->semester_id,
                    'year_level' => $subjectUnderCurriculum->pivot->year_level,
                ]);
            })
            ->where([
                'academic_year_schedule_id' => $subjectClass->academic_year_schedule_id,
            ])
            ->where('id', '!=', $subjectClass->id)
            ->where([
                'is_block' => $subjectClass->is_block,
                'section' => $section,
            ])
            ->select('subject_classes.*')
            ->groupBy('subject_classes.id')
            ->get();

        $dayStrings = fn (int $val) => match ($val) {
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            0 => 'Sunday',
        };

        $occupiedSlots = collect();
        foreach ($relatedSubjectClasses as $relatedSubjectClass) {
            foreach ($relatedSubjectClass->schedule['days'] as $day) {
                $dayString = $dayStrings($day['day']);
                $durationInHours = $day['duration_in_hours'] ?? 0;
                $start = Carbon::now();
                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);
                $occupiedSlots->push([
                    'start' => $start,
                    'end' => $start->copy()->addHours($durationInHours),
                    'resource_id' => $day['resource_id'],
                    'type' => 'same_resource',
                    'related_subject_class' => $relatedSubjectClass,
                ]);
            }
        }
        foreach ($assignedToUserSubjectClasses as $assignedToUserSubjectClass) {
            foreach ($assignedToUserSubjectClass->schedule['days'] as $day) {
                $dayString = $dayStrings($day['day']);
                $durationInHours = $day['duration_in_hours'] ?? 0;
                $start = Carbon::now();
                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);
                $occupiedSlots->push([
                    'start' => $start,
                    'end' => $start->copy()->addHours($durationInHours),
                    'resource_id' => $day['resource_id'],
                    'type' => 'same_assigned_user',
                    'related_subject_class' => $assignedToUserSubjectClass,
                ]);
            }
        }
        foreach ($relatedSubjectClassesByBlockSection as $relatedSubjectClassByBlockSection) {
            foreach ($relatedSubjectClassByBlockSection->schedule['days'] as $day) {
                $dayString = $dayStrings($day['day']);
                $durationInHours = $day['duration_in_hours'] ?? 0;
                $start = Carbon::now();
                $start = $start->is($dayString) ? $start : $start->next($dayString);
                $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(0);
                $occupiedSlots->push([
                    'start' => $start,
                    'end' => $start->copy()->addHours($durationInHours),
                    'resource_id' => $day['resource_id'],
                    'type' => 'same_block_section',
                    'related_subject_class' => $relatedSubjectClassByBlockSection,
                ]);
            }
        }

        $days = request()->input('schedule.days');
        foreach ($days as $day) {
            $durationInHours = $day['duration_in_hours'] ?? 0;
            $start = Carbon::now();
            $start = $start->is($dayStrings($day['day'])) ? $start : $start->next($dayStrings($day['day']));
            $start->setHour($day['start_time']['hour'])->setMinute($day['start_time']['minute'])->setSecond(1);
            $end = $start->copy()->addHours($durationInHours);
            $resourceId = $day['resource_id'];

            // conflict check to related subject classes utilizing the same resource (room)
            $closestSubjectClassInConflictByResource = null;
            $overlaps1 = $occupiedSlots->filter(fn ($occupiedSlot) => $occupiedSlot['type'] === 'same_resource')
                ->contains(function ($occupiedSlot) use ($start, $end, $resourceId, &$closestSubjectClassInConflictByResource) {
                    $sameResource = $occupiedSlot['resource_id'] == $resourceId;
                    $startConflict = $start->between($occupiedSlot['start'], $occupiedSlot['end']);
                    $endConflictCase1 = $end->subSeconds(1) != $occupiedSlot['start'] && $end->between($occupiedSlot['start'], $occupiedSlot['end']);
                    $endConflictCase2 = $end->greaterThanOrEqualTo($occupiedSlot['end']) && $occupiedSlot['end']->between($start, $end);
                    $endConflict = $endConflictCase1 || $endConflictCase2;

                    $isConflict = $sameResource && ($startConflict || $endConflict);
                    if ($isConflict) {
                        $closestSubjectClassInConflictByResource = $occupiedSlot['related_subject_class'];
                    }

                    return $isConflict;
                });
            $closestSubjectClassInConflict = $closestSubjectClassInConflictByResource;

            // conflict check other assigned to user subject classes in other resources (rooms)
            $closestSubjectClassInConflictByAssignedToUser = null;
            $overlaps2 = false;

            if (! $overlaps1) {
                $overlaps2 = $occupiedSlots->filter(fn ($occupiedSlot) => $occupiedSlot['type'] === 'same_assigned_user')
                    ->contains(function ($occupiedSlot) use ($start, $end, &$closestSubjectClassInConflictByAssignedToUser) {
                        $startConflict = $start->between($occupiedSlot['start'], $occupiedSlot['end']);
                        $endConflictCase1 = $end->subSeconds(1) != $occupiedSlot['start'] && $end->between($occupiedSlot['start'], $occupiedSlot['end']);
                        $endConflictCase2 = $end->greaterThanOrEqualTo($occupiedSlot['end']) && $occupiedSlot['end']->between($start, $end);
                        $endConflict = $endConflictCase1 || $endConflictCase2;

                        $isConflict = $startConflict || $endConflict;
                        if ($isConflict) {
                            $closestSubjectClassInConflictByAssignedToUser = $occupiedSlot['related_subject_class'];
                        }

                        return $isConflict;
                    });
                $closestSubjectClassInConflict = $closestSubjectClassInConflictByResource;
            }

            // conflict check block section subject class in other block sections
            $closestSubjectClassInConflictByBlockSection = null;
            $overlaps3 = false;

            if (! $overlaps1 && ! $overlaps2) {
                $overlaps3 = $occupiedSlots->filter(fn ($occupiedSlot) => $occupiedSlot['type'] === 'same_block_section')
                    ->contains(function ($occupiedSlot) use ($start, $end, &$closestSubjectClassInConflictByBlockSection) {
                        $startConflict = $start->between($occupiedSlot['start'], $occupiedSlot['end']);
                        $endConflictCase1 = $end->subSeconds(1) != $occupiedSlot['start'] && $end->between($occupiedSlot['start'], $occupiedSlot['end']);
                        $endConflictCase2 = $end->greaterThanOrEqualTo($occupiedSlot['end']) && $occupiedSlot['end']->between($start, $end);
                        $endConflict = $endConflictCase1 || $endConflictCase2;

                        $isConflict = $startConflict || $endConflict;
                        if ($isConflict) {
                            $closestSubjectClassInConflictByBlockSection = $occupiedSlot['related_subject_class'];
                        }

                        return $isConflict;
                    });
                $closestSubjectClassInConflict = $closestSubjectClassInConflictByResource;
            }

            if ($overlaps1 || $overlaps2 || $overlaps3) {
                $message = 'Time slot has conflicts.';
                if ($overlaps1) {
                    $message .= ' Conflicts with subject class '.$closestSubjectClassInConflict?->code.' in the same room.';
                } elseif ($overlaps2) {
                    $message .= ' Conflicts with subject class '.$closestSubjectClassInConflict?->code.' with the same faculty.';
                } else {
                    if ($overlaps3) {
                        $message .= ' Conflicts with subject class '.$closestSubjectClassInConflict?->code.' in the same block section.';
                    }
                }

                return response()->json(['error' => $message], 422);
            }
        }

        $subjectClass->schedule = request()->input('schedule');
        $subjectClass->save();

        return response()->noContent();
    });

    Route::group(['prefix' => 'academic-year-schedules/{academicYearSchedule}'], function () {
        Route::get('/', AcademicYearScheduleController::class);
        Route::get(
            '/course-curricula/{curriculum}/subjects',
            AcademicYearScheduleCurriculumSubjectController::class
        );
        Route::get(
            '/course-curricula/{curriculum}/offerings',
            [AcademicYearScheduleCurriculumOfferingController::class, 'index']
        );
        Route::post(
            '/course-curricula/{curriculum}/offerings',
            [AcademicYearScheduleCurriculumOfferingController::class, 'store']
        );
        Route::delete(
            '/course-curricula/{curriculum}/offerings',
            [AcademicYearScheduleCurriculumOfferingController::class, 'destroy']
        );
        Route::get('/departments/{department}/faculties-load-units', [AcademicYearScheduleDepartmentLoadController::class, 'getFacultiesLoadUnits']);
        Route::get('/departments/{department}/faculties-load-subject-classes', [AcademicYearScheduleDepartmentLoadController::class, 'getFacultiesLoadSubjectClasses']);
    });

    Route::group(['prefix' => 'common'], function () {
        Route::get('courses', CourseController::class);
        Route::get('curricula', CurriculumController::class);
        Route::get('departments', DepartmentController::class);
        Route::get('rooms', RoomController::class);
        Route::get('semesters', SemesterController::class);
        Route::get('subjects', SubjectController::class);
        Route::get('users', UserController::class);
    });
});
