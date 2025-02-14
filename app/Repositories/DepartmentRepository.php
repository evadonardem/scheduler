<?php

namespace App\Repositories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Collection;

class DepartmentRepository
{
    public function __construct(
        protected Department $department
    ) {}

    public function getDepartments(): Collection
    {
        return $this->department->newQuery()->orderBy('title')->get();
    }
}
