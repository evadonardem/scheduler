<?php

namespace Database\Seeders;

use App\Models\AcademicYearSchedule;
use App\Models\Course;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Department;
use App\Models\Room;
use App\Models\Subject;
use App\Models\SubjectClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FakeSeeder extends Seeder
{
    public function __construct(
        private AcademicYearSchedule $academicYearSchedule,
        private Course $course,
        private CurriculumSubject $curriculumSubject,
        private Curriculum $curriculum,
        private Department $department,
        private Room $room,
        private Subject $subject,
        private SubjectClass $subjectClass,
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
        $this->academicYearSchedule->newQuery()->delete();
        $this->command->info('Cleared departments, courses, subjects, and academic year schedules!');

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
                $this->subject->factory(50)
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

        $this->command->line('Create fake rooms...');
        $this->room->newQuery()->delete();
        $this->room
            ->factory(100)
            ->sequence(fn () => [
                'default_owner_department_id' => Department::all()->random()->id,
            ])
            ->create();
        $this->command->info('Done! Fake rooms created.');

        $this->command->line('Create fake curriculums...');
        $this->course->newQuery()->get()->each(function (Course $course) use ($defaultUser) {
            $curriculum = $this->curriculum->factory()->create([
                'course_id' => $course->id,
                'is_active' => fake()->boolean(),
                'is_draft' => fake()->boolean(),
                'created_by' => $defaultUser->id,
            ]);

            foreach (range(1, 4) as $yearLevel) {
                $this->curriculumSubject->factory()->create([
                    'curriculum_id' => $curriculum->id,
                    'year_level' => $yearLevel,
                    'subject_id' => Subject::all()->random()->id,
                    'created_by' => $defaultUser->id,
                ]);
            }
        });
        $this->command->info('Done! Fake curriculums created.');

        $this->command->line('Create fake academic year schedule');
        $academicYearSchedule = $this->academicYearSchedule->factory()->create([
            'academic_year' => '2024-2025',
            'semester_id' => 2,
            'start_date' => '2024-01-01',
            'end_date' => '2024-04-30',
        ]);
        $this->command->info('Done! Fake academic year schedule created.');

        $subjects = Subject::all();
        $this->subjectClass->factory(100)
            ->sequence(function (Sequence $sequence) use ($subjects) {
                $subject = $subjects->random();
                $user = User::whereHas('departments', function (Builder $query) use ($subject) {
                    $relationTable = $query->getModel()->getTable();
                    $query->where("$relationTable.id", $subject->department_id);
                })->get()->random();

                $isAssigned = fake()->boolean();
                $isSliced = fake()->boolean();

                $schedule = null;
                if ($isSliced) {

                    $days = [];
                    foreach (fake()->randomElements(range(0, 6), 3) as $day) {
                        $days[] = [
                            'day' => $day,
                            'start_time' => null,
                            'resource_id' => null,
                        ];
                    }

                    $schedule = [
                        'per_session_duration' => random_int(1, 5),
                        'days' => $days,
                    ];
                }

                return [
                    'code' => "$subject->code-$sequence->index",
                    'subject_id' => $subject->id,
                    'assigned_to_user_id' => $isAssigned ? $user->id : null,
                    'schedule' => $schedule,
                ];
            })
            ->create([
                'academic_year_schedule_id' => $academicYearSchedule->id,
            ]);
    }
}
