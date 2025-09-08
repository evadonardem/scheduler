<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpecializationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->name,
            'name' => $this->name,
        ];
    }
}
