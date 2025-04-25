<?php

namespace App\Repositories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CourseRepository
{
    public function __construct(
        protected Course $course
    ) {}

    public function getCourses(?int $departmentId = null, bool $withActiveCurricula = false): Collection
    {
        $query = $this->course->newQuery();

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        if ($withActiveCurricula) {
            $query->whereHas('curricula', function (Builder $query) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.is_active", true);
            });
        }

        return $query->orderBy('title')->get();
    }
}
