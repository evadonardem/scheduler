<?php

namespace App\Repositories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class DepartmentRepository
{
    public function __construct(
        protected Department $department
    ) {}

    public function getDepartments(array $filters = []): Collection
    {
        $query = $this->department->newQuery();

        if ($filters['with_active_curricula'] ?? false) {
            $query->whereHas('courses.curricula', function (Builder $query) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.is_active", true);
            });
        }

        return $query->orderBy('title')->get();
    }
}
