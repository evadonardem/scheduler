<?php

namespace App\Http\Controllers;

use App\Http\Resources\DepartmentResource;
use App\Http\Resources\UserResource;
use App\Models\Department;
use App\Models\User;
use App\Services\DepartmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        protected User $userModel,
        protected Department $departmentModel,
        protected DepartmentService $departmentService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);

        $users = $this->userModel->newQuery()
            ->orderBy('last_name');

        if ($perPage > 0) {
            $users = $users->paginate($perPage);
        } else {
            $users = $users->get();
        }

        return Inertia::render('User/List', [
            'users' => UserResource::collection($users),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $filename = $request->file('users');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        if ([
            'ID',
            'LAST NAME',
            'FIRST NAME',
            'GENDER',
            'EMAIL',
            'DEPARTMENT CODE',
        ] !== $headers) {
            return back()->with([
                'scheduler-flash-message' => [
                    'severity' => 'error',
                    'value' => 'Invalid import template.',
                ],
            ]);
        }

        $data = [];
        $userDepartments = [];
        while ($row = fgetcsv($fileHandle)) {
            $department = $this->departmentModel->newQuery()
                ->where('code', $row[5])
                ->first();
            if (! $department) {
                continue;
            }
            $data[] = [
                'institution_id' => $row[0],
                'last_name' => $row[1],
                'first_name' => $row[2],
                'gender' => $row[3],
                'email' => $row[4],
                'password' => '',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $userDepartments[$row[0]] = $department->id;
        }
        fclose($fileHandle);

        $this->userModel->newQuery()
            ->upsert(
                $data,
                ['institution_id', 'email'],
                ['last_name', 'first_name', 'gender']
            );

        foreach ($userDepartments as $userInstitutionId => $departmentId) {
            $user = $this->userModel->newQuery()
                ->where('institution_id', $userInstitutionId)
                ->first();
            if ($user) {
                $user->departments()->attach($departmentId);
                if (! $user->hasRole('Faculty')) {
                    $user->assignRole('Faculty');
                }
            }
        }

        Session::flash('scheduler-flash-message', [
            'severity' => 'success',
            'value' => 'Import success.',
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $departments = $this->departmentService->getDepartments();

        return Inertia::render('User/Edit', [
            'departments' => DepartmentResource::collection($departments),
            'user' => UserResource::make($user),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/users.csv'));
    }
}
