<?php

namespace App\Services;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Repositories\CurriculumRepository;
use Illuminate\Database\Eloquent\Collection;

class CurriculumService
{
    public function __construct(
        protected CurriculumRepository $curriculumRepository,
    ) {}

    public function getAllActiveByCourse(array $filters = []): Collection
    {
        return $this->curriculumRepository->getAll($filters);
    }

    public function getSubjectsByYearLevel(Curriculum $curriculum)
    {
        $curriculumId = $curriculum->id;
        $registeredYearLevels = $this->curriculumRepository->getRegisteredYearLevels($curriculumId);
        $curriculumSubjectsGroupByYearLevel = $curriculum->subjects()
            ->orderBy('year_level')
            ->orderBy('semester_id')
            ->get()
            ->groupBy(function (CurriculumSubject $curriculumSubject) {
                return "$curriculumSubject->year_level-$curriculumSubject->semester_id";
            });

        $registeredYearLevels->each(function ($item) use ($curriculumSubjectsGroupByYearLevel) {
            $item->subjects = $curriculumSubjectsGroupByYearLevel->get("$item->year_level-$item->semester_id");
        });

        $curriculum->coverage = $registeredYearLevels;

        return $curriculum;
    }
}
