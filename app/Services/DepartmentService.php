<?php

namespace App\Services;

use App\Repositories\DepartmentRepository;
use Illuminate\Database\Eloquent\Collection;

class DepartmentService
{
    public function __construct(
        protected DepartmentRepository $departmentRepository,
    ) {}

    public function getDepartments(array $filters = []): Collection
    {
        $allowedFilters = [];

        if ($filters['with_active_curricula'] ?? false) {
            $allowedFilters['with_active_curricula'] = $filters['with_active_curricula'];
        }

        return $this->departmentRepository->getDepartments($allowedFilters);
    }
}
