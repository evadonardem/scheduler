<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'email' => $this->email,
            'gender' => $this->gender,
            'department' => $this->departments->isNotEmpty()
                ? DepartmentResource::make($this->departments->first())
                : null,
            'roles' => $this->roles->pluck('name'),
            'total_units' => $this->whenHas('total_units', function () {
                return $this->total_units;
            }),
        ];
    }
}
