<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(Role $roleModel): void
    {
        $roles = [
            'Super Admin',
            'Dean',
            'Faculty',
        ];

        foreach ($roles as $name) {
            $roleModel->newQuery()->firstOrCreate([
                'name' => $name,
            ]);
        }
    }
}
