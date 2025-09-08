<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpecializationResource;
use App\Services\SpecializationService;
use Illuminate\Http\Request;

class SpecializationController extends Controller
{
    public function __construct(
        protected SpecializationService $specializationService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $filters = $request->input('filters', []);

        return SpecializationResource::collection($this->specializationService->getSpecializations($filters));
    }
}
