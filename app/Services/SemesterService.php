<?php

namespace App\Services;

use App\Models\Semester;
use App\Repositories\SemesterRepository;
use Illuminate\Database\Eloquent\Collection;

class SemesterService
{
    public function __construct(
        protected SemesterRepository $semesterRepository,
    ) {}

    public function getSemesterById(int $id): Semester
    {
        return $this->semesterRepository->getSemesterById($id);
    }

    public function getSemesters(): Collection
    {
        return $this->semesterRepository->getSemesters();
    }
}
