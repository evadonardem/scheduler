<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumOfferingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'year_level' => $this->year_level,
            'semesters' => $this->semesters,
        ];
    }
}
