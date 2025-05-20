<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubjectResource;
use App\Services\SubjectService;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function __construct(
        protected SubjectService $roomService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $filters = $request->input('filters', []);

        return SubjectResource::collection($this->roomService->getSubjects($filters));
    }
}
