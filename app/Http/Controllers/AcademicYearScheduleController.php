<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAcademicYearScheduleRequest;
use App\Http\Requests\UpdateAcademicYearScheduleRequest;
use App\Http\Resources\AcademicYearScheduleResource;
use App\Models\AcademicYearSchedule;
use App\Services\AcademicYearScheduleService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AcademicYearScheduleController extends Controller
{
    public function __construct(
        protected AcademicYearScheduleService $academicYearScheduleService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $authUserDepartment = $authUser->departments->first();
        $authUserRoles = $authUser->roles->pluck('name');

        $perPage = $request->input('per_page', 5);

        $academicYearSchedules = $this->academicYearScheduleService->getAllAcademicYearSchedules($perPage);

        if (! $authUserRoles->contains(fn ($role) => in_array($role, ['Super Admin']))) {
            if ($authUserRoles->contains(fn ($role) => in_array($role, ['Dean', 'Associate Dean']))) {
                $academicYearSchedules->loadCount([
                    'subjectClasses' => function (Builder $query) use ($authUserDepartment) {
                        $query->whereHas('curriculumSubject.curriculum.course', function (Builder $query) use ($authUserDepartment) {
                            $relationTable = $query->getModel()->getTable();
                            $query->where("$relationTable.department_id", $authUserDepartment?->id ?? 0);
                        });
                    },
                ]);
            } else {
                $academicYearSchedules->loadCount([
                    'subjectClasses' => function (Builder $query) use ($authUser) {
                        $relationTable = $query->getModel()->getTable();
                        $query->where("$relationTable.assigned_to_user_id", $authUser->id);
                    },
                ]);
            }
        }

        return Inertia::render('AcademicYearSchedule/List', [
            'academicYearSchedules' => AcademicYearScheduleResource::collection($academicYearSchedules),
        ]);
    }

    public function store(StoreAcademicYearScheduleRequest $request)
    {
        $data = $request->only(['academic_year', 'start_date', 'end_date', 'semester_id']);
        $this->academicYearScheduleService->createAcademicYearSchedule($data);
    }

    /**
     * Display the specified resource.
     */
    public function show(AcademicYearSchedule $academicYearSchedule)
    {
        request()->merge([
            'fields' => ['scheduled_subject_classes'],
        ]);

        return Inertia::render('AcademicYearSchedule/Show', [
            'academicYearSchedule' => AcademicYearScheduleResource::make($academicYearSchedule),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AcademicYearSchedule $academicYearSchedule)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAcademicYearScheduleRequest $request, AcademicYearSchedule $academicYearSchedule)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AcademicYearSchedule $academicYearSchedule)
    {
        //
    }
}
