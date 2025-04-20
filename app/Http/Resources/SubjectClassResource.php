<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'color' => '#' . substr(md5($this->code), 0, 6),
            'subject' => SubjectResource::make($this->subject),
            'schedule' => $this->schedule,
            'assigned_to' => $this->whenNotNull($this->assigned_to, UserResource::make($this->assignedTo)),
        ];
    }
}
