<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(User $user): void
    {
        // Default User
        $defaultUser = $user->newQuery()
            ->firstOrCreate(
                [
                    'email' => 'ginard.guaki@kcp.edu.ph',
                ],
                [
                    'institution_id' => '01234567891',
                    'first_name' => 'Ginard',
                    'last_name' => 'Guaki',
                    'gender' => 'Male',
                    'password' => Hash::make('123456'),
                ]
            );
        
        $this->call([
            RoleSeeder::class,
        ]);

        $defaultUser->assignRole('Super Admin');
    }
}
