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

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);
        $searchKey = $request->input('searchKey');
        $departmentId = $request->input('filters.department.id');

        $usersQuery = $this->userModel->newQuery();

        if ($searchKey) {
            $usersQuery->where(function ($query) use ($searchKey) {
                $query->where('institution_id', 'like', '%'.$searchKey.'%')
                    ->orWhere('last_name', 'like', '%'.$searchKey.'%')
                    ->orWhere('first_name', 'like', '%'.$searchKey.'%')
                    ->orWhere('email', 'like', '%'.$searchKey.'%');
            });
        }

        if ($departmentId) {
            $usersQuery->whereHas('departments', function ($query) use ($departmentId) {
                $query->where('departments.id', $departmentId);
            });
        }

        $usersQuery->orderBy('last_name');

        if ($perPage > 0) {
            $users = $usersQuery->paginate($perPage);
        } else {
            $users = $usersQuery->get();
        }

        return Inertia::render('User/List', [
            'users' => UserResource::collection($users),
        ]);
    }

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

    public function edit(User $user)
    {
        $departments = $this->departmentService->getDepartments();

        return Inertia::render('User/Edit', [
            'departments' => DepartmentResource::collection($departments),
            'user' => UserResource::make($user),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->only([
            'last_name',
            'first_name',
        ]);

        $roles = $request->input('roles', []);

        if ($data) {
            $user->update($data);
        }

        if ($roles) {
            $user->syncRoles($roles);
        }

        $user->refresh();

        return UserResource::make($user);
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/users.csv'));
    }
}
