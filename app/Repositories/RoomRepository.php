<?php

namespace App\Repositories;

use App\Models\Room;

class RoomRepository
{
    public function __construct(
        protected Room $room
    ) {}

    public function getRooms(array $filters = [])
    {
        $query = $this->room->newQuery();

        if ($filters['department_id'] ?? false) {
            $query->where('default_owner_department_id', $filters['department_id']);
        }

        return $query->orderBy('name')->get();
    }
}
