<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class SubjectController extends Controller
{
    private $authUser;

    public function __construct(
        protected Department $departmentModel,
        protected Subject $subjectModel
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

        $subjectsQuery = $this->subjectModel->newQuery();

        if ($this->authUser->isSuperAdmin) {
            if ($filters['department']['id'] ?? false) {
                $subjectsQuery->where('department_id', $filters['department']['id']);
            }
        } else {
            $subjectsQuery->where('department_id', $this->authUser->departments->first()?->id ?? 0);
        }

        $subjectsQuery
            ->withCount('curricula')
            ->with('department')->orderBy('title');

        if ($perPage > 0) {
            $subjects = $subjectsQuery->paginate($perPage);
        } else {
            $subjects = $subjectsQuery->get();
        }

        return Inertia::render('Subject/List', [
            'subjects' => SubjectResource::collection($subjects),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSubjectRequest $request)
    {
        $departmentId = $request->input('department_id');
        $filename = $request->file('subjects');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        if ([
            'SUBJECT CODE',
            'SUBJECT TITLE',
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

        $this->subjectModel->newQuery()
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
        $subject->delete();
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/subjects.csv'));
    }
}
