<?php

namespace App\Repositories;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Semester;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CurriculumRepository
{
    public function __construct(
        protected Curriculum $curriculum,
        protected CurriculumSubject $curriculumSubject,
        protected Semester $semester,
    ) {}

    public function getAll(array $filters = []): Collection
    {
        $query = $this->curriculum->newQuery();

        if ($filters['course_id'] ?? false) {
            $query->where('course_id', $filters['course_id']);
        }

        if ($filters['is_active'] ?? false) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->get();
    }

    public function getRegisteredYearLevels(int $curriculumId)
    {
        $curriculumSubjectTable = $this->curriculumSubject->getTable();
        $semesterTable = $this->semester->getTable();

        return DB::table($curriculumSubjectTable)
            ->select([
                "$curriculumSubjectTable.year_level",
                "$curriculumSubjectTable.semester_id",
                "$semesterTable.title as semester",
            ])
            ->join($semesterTable, "$curriculumSubjectTable.semester_id", '=', "$semesterTable.id")
            ->groupBy(["$curriculumSubjectTable.year_level", "$curriculumSubjectTable.semester_id"])
            ->orderBy("$curriculumSubjectTable.year_level")
            ->orderBy("$curriculumSubjectTable.semester_id")
            ->where("$curriculumSubjectTable.curriculum_id", $curriculumId)
            ->get();
    }
}
