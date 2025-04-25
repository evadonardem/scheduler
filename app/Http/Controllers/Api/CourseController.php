<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Services\CourseService;
use Illuminate\Http\Request;

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
        $departmentId = $request->input('filters.department.id');

        return CourseResource::collection($this->courseService->getCourses($departmentId));
    }
}
