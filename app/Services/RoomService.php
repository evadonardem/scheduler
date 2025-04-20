<?php

namespace App\Services;

use App\Repositories\RoomRepository;
use Illuminate\Database\Eloquent\Collection;

class RoomService
{
    public function __construct(
        protected RoomRepository $roomRepository,
    ) {}

    public function getRooms(array $filters): Collection
    {
        return $this->roomRepository->getRooms($filters);
    }
}
