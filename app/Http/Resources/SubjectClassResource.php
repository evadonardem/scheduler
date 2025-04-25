<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $curriculumSubject = $this->curriculumSubject;
        $subject = $curriculumSubject->subject;
        $curriculum = $curriculumSubject->curriculum;
        $course = $curriculum->course;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'section' => [
                'id' => $this->section,
                'course' => CourseResource::make($course),
                'year_level' => $curriculumSubject->year_level,
                'is_block' => (bool) $this->is_block,
            ],
            'color' => '#'.substr(md5($this->code), 0, 6),
            'subject' => SubjectResource::make($subject),
            'credit_hours' => $this->credit_hours,
            'schedule' => $this->schedule,
            'assigned_to' => $this->whenNotNull($this->assigned_to, UserResource::make($this->assignedTo)),
        ];
    }
}
