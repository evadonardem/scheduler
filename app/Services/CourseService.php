<?php

namespace App\Services;

use App\Repositories\CourseRepository;
use Illuminate\Database\Eloquent\Collection;

class CourseService
{
    public function __construct(
        protected CourseRepository $courseRepository,
    ) {}

    public function getCourses(?int $departmentId = null, bool $isActive = false): Collection
    {
        return $this->courseRepository->getCourses($departmentId, $isActive);
    }
}
