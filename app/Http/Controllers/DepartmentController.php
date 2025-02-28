<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function __construct(
        protected Department $departmentModel
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $departments = $this->departmentModel->newQuery()
            ->orderBy('title');

        if ($perPage > 0) {
            $departments = $departments->paginate($perPage);
        } else {
            $departments = $departments->get();
        }

        return Inertia::render('Department/List', [
            'departments' => DepartmentResource::collection($departments),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDepartmentRequest $request)
    {
        $filename = $request->file('departments');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        $data = [];
        while ($row = fgetcsv($fileHandle)) {
            $data[] = [
                'code' => $row[0],
                'title' => $row[1],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($fileHandle);

        $this->departmentModel->newQuery()
            ->upsert(
                $data,
                ['code'],
                ['title']
            );
    }

    /**
     * Display the specified resource.
     */
    public function show(Department $department)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        //
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/departments.csv'));
    }
}
