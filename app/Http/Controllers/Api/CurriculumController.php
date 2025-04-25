<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurriculumResource;
use App\Services\CurriculumService;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    public function __construct(
        protected CurriculumService $curriculumService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $courseId = $request->input('filters.course.id');
        $isActive = $request->input('filters.is_active');

        return CurriculumResource::collection($this->curriculumService->getAllActiveByCourse([
            'course_id' => $courseId,
            'is_active' => $isActive,
        ]));
    }
}
