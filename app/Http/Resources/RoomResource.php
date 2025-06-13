<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'color' => '#'.substr(md5($this->code), 0, 6),
            'name' => $this->name,
            'is_lec' => $this->is_lec,
            'is_lab' => $this->is_lab,
            'capacity' => $this->capacity,
            'department' => DepartmentResource::make($this->defaultOwnerDepartment),
        ];
    }
}
