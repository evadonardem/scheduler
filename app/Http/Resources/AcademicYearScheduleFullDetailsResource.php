<?php

namespace App\Http\Resources;

use App\Services\AcademicYearScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicYearScheduleFullDetailsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $academicYearScheduleService = app()->make(AcademicYearScheduleService::class);
        $plottableWeek = $academicYearScheduleService->getPlottableWeek($this->resource);
        return [
            'id' => $this->id,
            'academic_year' => $this->academic_year,
            'semester' => SemesterResource::make($this->semester),
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'plottable_week' => $plottableWeek,
            'is_active' => (bool) $this->is_active,
            'subject_classes' => SubjectClassResource::collection($this->subjectClasses),
        ];
    }
}
