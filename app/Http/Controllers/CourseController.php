<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class CourseController extends Controller
{
    private $authUser;

    public function __construct(
        protected Course $courseModel,
        protected Department $departmentModel,
    ) {
        $this->authUser = Auth::user();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);
        $filters = $request->input('filters');

        $coursesQuery = $this->courseModel->newQuery();

        if ($this->authUser->isSuperAdmin) {
            if ($filters['department']['id'] ?? false) {
                $coursesQuery->where('department_id', $filters['department']['id']);
            }
        } else {
            $coursesQuery->where('department_id', $this->authUser->departments->first()?->id ?? 0);
        }

        $coursesQuery->with('department')->orderBy('title');

        if ($perPage > 0) {
            $courses = $coursesQuery->paginate($perPage);
        } else {
            $courses = $coursesQuery->get();
        }

        return Inertia::render('Course/List', [
            'courses' => CourseResource::collection($courses),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCourseRequest $request)
    {
        $departmentId = $request->input('department_id');
        $filename = $request->file('courses');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        if ([
            'COURSE CODE',
            'COURSE TITLE',
        ] !== $headers) {
            return back()->with([
                'scheduler-flash-message' => [
                    'severity' => 'error',
                    'value' => 'Invalid import template.',
                ],
            ]);
        }

        $data = [];
        while ($row = fgetcsv($fileHandle)) {
            $data[] = [
                'code' => $row[0],
                'title' => $row[1],
                'department_id' => $departmentId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($fileHandle);

        $this->courseModel->newQuery()
            ->upsert(
                $data,
                ['code'],
                ['title']
            );

        Session::flash('scheduler-flash-message', [
            'severity' => 'success',
            'value' => 'Import success.',
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Course $course)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCourseRequest $request, Course $course)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Course $course)
    {
        //
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/courses.csv'));
    }
}
