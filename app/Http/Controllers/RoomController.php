<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Department;
use App\Models\Room;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function __construct(
        protected Department $departmentModel,
        protected Room $roomModel
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);
        $searchKey = $request->input('searchKey');
        $departmentId = $request->input('filters.department.id');

        $roomsQuery = $this->roomModel->newQuery();

        if ($searchKey) {
            $roomsQuery->where(function (Builder $query) use ($searchKey) {
                $query->where('code', 'like', "%$searchKey%");
                $query->orWhere('name', 'like', "%$searchKey%");
            });
        }

        if ($departmentId) {
            $roomsQuery->whereHas('defaultOwnerDepartment', function ($query) use ($departmentId) {
                $relationTable = $query->getModel()->getTable();
                $query->where("$relationTable.id", $departmentId);
            });
        }

        $roomsQuery->orderBy('code');

        if ($perPage > 0) {
            $rooms = $roomsQuery->paginate($perPage);
        } else {
            $rooms = $roomsQuery->get();
        }

        return Inertia::render('Room/List', [
            'rooms' => RoomResource::collection($rooms),
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
        $filename = $request->file('rooms');
        $fileHandle = fopen($filename, 'r');
        $headers = fgetcsv($fileHandle);

        if ([
            'CODE',
            'NAME',
            'IS LEC?',
            'IS LAB?',
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
        while ($row = fgetcsv($fileHandle)) {
            $department = $this->departmentModel->newQuery()
                ->where('code', $row[4])
                ->first();
            if (! $department) {
                continue;
            }
            $data[] = [
                'code' => $row[0],
                'name' => $row[1],
                'is_lec' => strcasecmp($row[2], 'Yes') === 0,
                'is_lab' => strcasecmp($row[3], 'No') === 0,
                'default_owner_department_id' => $department->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($fileHandle);

        $this->roomModel->newQuery()
            ->upsert(
                $data,
                ['code'],
                ['name', 'is_lec', 'is_lab']
            );

        Session::flash('scheduler-flash-message', [
            'severity' => 'success',
            'value' => 'Import success.',
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Room $room)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Room $room)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoomRequest $request, Room $room)
    {
        $data = $request->only([
            'name',
            'capacity',
        ]);

        if ($data) {
            $room->update($data);
        }

        $room->refresh();

        return RoomResource::make($room);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Room $room)
    {
        //
    }

    public function downloadTemplate()
    {
        return response()->download(storage_path('import_templates/rooms.csv'));
    }
}
