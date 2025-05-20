<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Services\CourseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        Log::debug($request->all());

        $departmentId = $request->input('filters.department.id');
        $isActive = $request->input('filters.is_active', false);

        return CourseResource::collection($this->courseService->getCourses($departmentId, $isActive));
    }
}
