<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SemesterResource;
use App\Services\SemesterService;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function __construct(
        protected SemesterService $semesterService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        return SemesterResource::collection($this->semesterService->getSemesters());
    }
}
