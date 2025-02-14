<?php

namespace App\Services;

use App\Repositories\DepartmentRepository;
use Illuminate\Database\Eloquent\Collection;

class DepartmentService
{
    public function __construct(
        protected DepartmentRepository $departmentRepository,
    ) {}

    public function getDepartments(): Collection
    {
        return $this->departmentRepository->getDepartments();
    }
}
