<?php

namespace App\Http\Controllers;

use App\Http\Resources\RoomResource;
use App\Models\Room;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct() {}

    public function index()
    {
        $rooms = Room::all()->random(4);
        
        return Inertia::render('Dashboard/Index', [
            'rooms' => RoomResource::collection($rooms),
            'academic_year_start_date' => Carbon::parse("2025-01-01", "Asia/Manila")->toISOString(),
            'academic_year_end_date' => Carbon::parse("2025-04-01", "Asia/Manila")->endOfDay()->toISOString(),
        ]);
    }
}
