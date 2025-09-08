<?php

namespace App\Services;

use App\Models\User;

class SpecializationService
{
    public function __construct(
        protected User $userModel,
    ) {}

    public function getSpecializations(array $filters)
    {
        $usersWithSpecializations = $this->userModel->newQuery()->whereNotNull('specializations')->get();

        return $usersWithSpecializations->flatMap(function ($user) {
            return $user->specializations ?? [];
        })->unique()->sort()->map(function ($specialization) {
            return (object) [
                'id' => $specialization,
                'name' => $specialization,
            ];
        })->values();
    }
}
