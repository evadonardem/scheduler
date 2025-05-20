<?php

namespace App\Services;

use App\Http\Requests\StoreCurriculumRequest;
use App\Http\Requests\StoreCurriculumSubjectRequest;
use App\Http\Requests\UpdateCurriculumRequest;
use App\Models\Curriculum;
use App\Repositories\CurriculumRepository;
use Illuminate\Database\Eloquent\Collection;

class CurriculumService
{
    private const MAPPING = [
        'department' => 'department_id',
        'course' => 'course_id',
        'initiated_by' => 'created_by',
    ];

    public function __construct(
        protected CurriculumRepository $curriculumRepository,
    ) {}

    public function addCurriculumSubjectFromRequest(
        Curriculum $curriculum,
        StoreCurriculumSubjectRequest $request
    ) {
        $requestData = $request->only([
            'year_level',
            'semester_id',
            'subject_id',
            'units_lec',
            'units_lab',
            'credit_hours',
            'initiated_by',
        ]);

        $curriculum->subjects()->attach([
            $requestData['subject_id'] => [
                'semester_id' => $requestData['semester_id'],
                'year_level' => $requestData['year_level'],
                'units_lec' => $requestData['units_lec'],
                'units_lab' => $requestData['units_lab'],
                'credit_hours' => $requestData['credit_hours'],
                'created_by' => $requestData['initiated_by'],
            ],
        ]);
    }

    public function createCurriculumFromRequest(StoreCurriculumRequest $request): Curriculum
    {
        $requestData = $request->only([
            'department',
            'course',
            'code',
            'description',
            'initiated_by',
        ]);

        $requestData = collect($requestData)->mapWithKeys(function ($value, $key) {
            return [
                self::MAPPING[$key] ?? $key => $value,
            ];
        })->toArray();

        return $this->curriculumRepository->createCurriculum($requestData);
    }

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
            ->groupBy(function ($curriculumSubject) {
                return "{$curriculumSubject->pivot->year_level}-{$curriculumSubject->pivot->semester_id}";
            });

        $registeredYearLevels->each(function ($item) use ($curriculumSubjectsGroupByYearLevel) {
            $item->subjects = $curriculumSubjectsGroupByYearLevel->get("$item->year_level-$item->semester_id");
        });

        $curriculum->coverage = $registeredYearLevels;

        return $curriculum;
    }

    public function updateCurriculumFromRequest(Curriculum $curriculum, UpdateCurriculumRequest $request): Curriculum
    {
        $requestData = $request->only(['description', 'is_active', 'is_draft', 'initiated_by']);

        $requestData = collect($requestData)->mapWithKeys(function ($value, $key) {
            return [
                self::MAPPING[$key] ?? $key => $value,
            ];
        })->toArray();

        return $this->curriculumRepository->updateCurriculum($curriculum, $requestData);
    }
}
