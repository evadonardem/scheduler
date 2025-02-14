<?php

namespace App\Repositories;

use App\Models\Semester;
use Illuminate\Database\Eloquent\Collection;

class SemesterRepository
{
    public function __construct(
        protected Semester $semester
    ) {}

    public function getSemesterById(int $id): Semester
    {
        return $this->semester->newQuery()
            ->where('id', $id)
            ->first();
    }

    public function getSemesters(): Collection
    {
        return $this->semester->newQuery()
            ->orderBy('id')
            ->get();
    }
}
