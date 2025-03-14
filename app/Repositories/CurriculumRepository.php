<?php

namespace App\Repositories;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;

class CurriculumRepository
{
    public function __construct(
        protected Curriculum $curriculum,
        protected CurriculumSubject $curriculumSubject,
        protected Semester $semester,
    ) {}

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
            ->join($semesterTable, "$curriculumSubjectTable.semester_id", "=", "$semesterTable.id")
            ->groupBy(["$curriculumSubjectTable.year_level", "$curriculumSubjectTable.semester_id"])
            ->orderBy("$curriculumSubjectTable.year_level")
            ->orderBy("$curriculumSubjectTable.semester_id")
            ->where("$curriculumSubjectTable.curriculum_id", $curriculumId)
            ->get();
    }
}
