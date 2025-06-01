<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $usersQuery = User::query();

        if ($request->has('filters.department')) {
            $usersQuery->whereHas('departments', function ($query) use ($request) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $request->input('filters.department.id'));
            });
        }

        if ($request->has('filters.academicYearSchedule.id')) {
            $academicYearScheduleId = $request->input('filters.academicYearSchedule.id');
            $usersQuery->with(['subjectClasses' => function ($query) use ($academicYearScheduleId) {
                $query->where('academic_year_schedule_id', $academicYearScheduleId);
            }]);
        }

        $users = $usersQuery->orderBy('last_name')->get();

        if ($request->has('filters.academicYearSchedule.id')) {
            $academicYearScheduleId = $request->input('filters.academicYearSchedule.id');
            $users = $users->map(function ($user) use ($academicYearScheduleId) {
                $user->total_units = $user->subjectClasses->where('academic_year_schedule_id', $academicYearScheduleId)->sum(function ($subjectClass) {
                    return ($subjectClass->curriculumSubject->units_lec ?? 0) + ($subjectClass->curriculumSubject->units_lab ?? 0);
                });

                return $user;
            });
        }

        return UserResource::collection($users);
    }
}
