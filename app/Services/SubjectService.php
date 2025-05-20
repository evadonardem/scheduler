<?php

namespace App\Services;

use App\Repositories\SubjectRepository;
use Illuminate\Database\Eloquent\Collection;

class SubjectService
{
    public function __construct(
        protected SubjectRepository $subjectRepository,
    ) {}

    public function getSubjects(array $filters): Collection
    {
        return $this->subjectRepository->getSubjects($filters);
    }
}
