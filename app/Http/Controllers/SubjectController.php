<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
    public function __construct(
        protected Department $departmentModel,
        protected Subject $subjectModel
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $subjects = $this->subjectModel->newQuery()
            ->with('department')
            ->orderBy('title')
            ->paginate($perPage);

        return Inertia::render('Subject/List', [
            'subjects' => SubjectResource::collection($subjects),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSubjectRequest $request)
    {
        $filename = $request->file('subjects');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        $data = [];
        while ($row = fgetcsv($fileHandle)) {
            $department = $this->departmentModel->newQuery()
                ->where('code', $row[2])
                ->first();
            if (! $department) {
                continue;
            }
            $data[] = [
                'code' => $row[0],
                'title' => $row[1],
                'department_id' => $department->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($fileHandle);

        $this->subjectModel->newQuery()
            ->upsert(
                $data,
                ['code'],
                ['title']
            );
    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSubjectRequest $request, Subject $subject)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        //
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/subjects.csv'));
    }
}
