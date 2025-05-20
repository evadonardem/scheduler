<?php

namespace App\Repositories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;

class SubjectRepository
{
    public function __construct(
        protected Subject $subject
    ) {}

    public function getSubjects(array $filters = []): Collection
    {
        $query = $this->subject->newQuery();

        if ($filters['department']['id'] ?? false) {
            $query->where('department_id', $filters['department']['id']);
        }

        if ($filters['curriculum']['id'] ?? false) {
            $curriculumId = $filters['curriculum']['id'];
            $query->whereDoesntHave('curricula', function ($query) use ($curriculumId) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $curriculumId);
            });
        }

        return $query->orderBy('title')->get();
    }
}
