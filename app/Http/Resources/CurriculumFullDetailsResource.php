<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumFullDetailsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'course' => CourseResource::make($this->course),
            'is_active' => (bool) $this->is_active,
            'is_draft' => (bool) $this->is_draft,
            'coverage' => $this->coverage,
        ];
    }
}
