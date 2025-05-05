<?php

namespace App\Repositories;

use App\Models\AcademicYearSchedule;
use App\Models\SubjectClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AcademicYearScheduleRepository
{
    public function __construct(
        protected AcademicYearSchedule $academicYearSchedule,
        protected SubjectClass $subjectClass,
        protected User $user,
    ) {}

    public function create($data): AcademicYearSchedule
    {
        return $this->academicYearSchedule->create($data);
    }

    public function getAll(?int $perPage = null): Collection|LengthAwarePaginator
    {
        return $this->academicYearSchedule->newQuery()
            ->withCount('subjectClasses')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester_id', 'desc')
            ->paginate($perPage);
    }

    public function getFacultyLoadUnits(int $academicYearScheduleId, int $departmentId, array $filters = [])
    {
        $usersQuery = $this->user->newQuery();

        if ($filters['user']['id'] ?? false) {
            $usersQuery->where('id', $filters['user']['id']);
        }

        return $usersQuery
            ->withWhereHas('departments', function ($query) use ($departmentId) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $departmentId);
            })
            ->withWhereHas('subjectClasses', function ($query) use ($academicYearScheduleId) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.academic_year_schedule_id", $academicYearScheduleId);
            })
            ->orderBy('last_name')
            ->get()
            ->map(function ($user) {
                $user->total_units = $user->subjectClasses->sum(function ($subjectClass) {
                    return ($subjectClass->curriculumSubject->units_lec ?? 0) + ($subjectClass->curriculumSubject->units_lab ?? 0);
                });

                return $user;
            });
    }

    public function getFacultyLoadSubjectClasses(int $academicYearScheduleId, int $departmentId, array $filters = [])
    {
        $subjectClassesQuery = $this->subjectClass->newQuery();

        return $subjectClassesQuery
            ->select('subject_classes.*')
            ->join('users', function ($join) use ($filters) {
                $join->on('subject_classes.assigned_to_user_id', '=', 'users.id');
                if ($filters['user']['id'] ?? false) {
                    $join->where('users.id', $filters['user']['id']);
                }
            })
            ->with(['curriculumSubject.subject'])
            ->withWhereHas('assignedTo.departments', function ($query) use ($departmentId) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $departmentId);
            })
            ->where('academic_year_schedule_id', $academicYearScheduleId)
            ->orderBy('users.last_name')
            ->get();
    }

    public function getLatestActiveAcademicYearSchedule(): ?AcademicYearSchedule
    {
        return $this->academicYearSchedule
            ->where('is_active', true)
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester_id', 'desc')
            ->first();
    }
}
