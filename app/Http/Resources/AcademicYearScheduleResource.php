<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicYearScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year' => $this->academic_year,
            'semester' => SemesterResource::make($this->semester),
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'is_active' => (bool) $this->is_active,
            'subject_classes_count' => $this->whenNotNull($this->subject_classes_count),
            'scheduled_subject_classes' => $this->whenLoaded(
                'scheduledSubjectClasses',
                SubjectClassResource::collection($this->scheduledSubjectClasses ?? collect())
            ),
        ];
    }
}
