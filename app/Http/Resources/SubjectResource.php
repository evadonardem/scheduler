<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'department' => new DepartmentResource($this->department),
            'pivot' => $this->whenPivotLoaded('curriculum_subject', function () {
                return $this->pivot->only(['id', 'units_lec', 'units_lab', 'credit_hours']);
            }),
            'is_deletable' => $this->curricula_count === 0,
        ];
    }
}
