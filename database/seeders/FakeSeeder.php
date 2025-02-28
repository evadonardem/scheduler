<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Department;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FakeSeeder extends Seeder
{
    public function __construct(
        private Course $course,
        private Department $department,
        private Subject $subject,
        private User $user
    ) {}

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->user->newQuery()->where('email', '<>', 'ginard.guaki@kcp.edu.ph')->delete();
        $this->command->info('Cleared users!');

        $this->department->newQuery()->delete();
        $this->course->newQuery()->delete();
        $this->subject->newQuery()->delete();
        $this->command->info('Cleared departments, courses, and subjects!');

        // Default User
        $defaultUser = $this->user->newQuery()
            ->firstOrCreate(
                [
                    'email' => 'ginard.guaki@kcp.edu.ph',
                ],
                [
                    'institution_id' => '456123',
                    'first_name' => 'Ginard',
                    'last_name' => 'Guaki',
                    'gender' => 'Male',
                    'password' => Hash::make('123456'),
                ]
            );
        $defaultUser->assignRole('Super Admin');

        $this->command->line('Create fake departments, courses, subjects, and users...');
        $departments = $this->department
            ->factory(10)
            ->has(
                $this->course->factory(2)
            )
            ->has(
                $this->subject->factory(5)
            )
            ->create();
        $departments->each(function (Department $department) {
            $users = $this->user->factory(10)->create([
                'password' => Hash::make('123456'),
            ]);
            $users->each(function (User $user) use ($department) {
                $user->departments()->attach($department);
                $user->assignRole('Faculty');
            });

            $user = $this->user->factory()->create([
                'password' => Hash::make('123456'),
            ]);
            $user->departments()->attach($department);
            $user->assignRole('Dean');
        });
        $this->command->info('Done! Fake departments, courses, subjects, and users created.');
    }
}
