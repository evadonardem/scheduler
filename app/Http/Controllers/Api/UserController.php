<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $usersQuery = User::query();

        if ($request->has('filters.department')) {
            $usersQuery->whereHas('departments', function ($query) use ($request) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $request->input('filters.department.id'));
            });
        }

        $users = $usersQuery->orderBy('last_name')->get();

        return UserResource::collection($users);
    }
}
