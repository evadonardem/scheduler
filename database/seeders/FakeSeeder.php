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
use Illuminate\Support\Collection;
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
                $this->course->factory(1)
            )
            ->has(
                $this->subject->factory(25)
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

        Department::all()->each(function (Department $department) {
            $this->room
                ->factory(fake()->numberBetween(3, 5))
                ->sequence(fn () => [
                    'default_owner_department_id' => $department->id,
                ])
                ->create();
        });
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
                $curriculumSubjectIds = $curriculum->fresh()->subjects->pluck('id')->toArray();
                $subjects = Subject::where('department_id', $course->department_id)
                    ->whereNotIn('id', $curriculumSubjectIds)
                    ->inRandomOrder()
                    ->limit(fake()->numberBetween(3, 5))
                    ->get();

                $subjectsData = $subjects->mapWithKeys(function (Subject $subject) use ($defaultUser, $yearLevel) {
                    return [
                        $subject->id => [
                            'year_level' => $yearLevel,
                            'semester_id' => 2,
                            'units_lec' => fake()->numberBetween(1, 5),
                            'units_lab' => fake()->numberBetween(1, 5),
                            'created_by' => $defaultUser->id,
                            'created_at' => now(),
                        ],
                    ];
                });

                $curriculum->subjects()->attach($subjectsData);
            }
        });
        $this->command->info('Done! Fake curriculums created.');

        $this->command->line('Create fake academic year schedule');
        $academicYearSchedule = $this->academicYearSchedule->factory()->create([
            'academic_year' => '2024-2025',
            'semester_id' => 2,
            'start_date' => '2025-01-01',
            'end_date' => '2025-04-30',
        ]);
        $this->command->info('Done! Fake academic year schedule created.');

        $this->command->line('Create fake subject classes');
        Curriculum::all()->each(function (Curriculum $curriculum) use ($academicYearSchedule) {
            $curriculumSubjectsByYearLevel = $curriculum->subjects()
                ->wherePivot('semester_id', $academicYearSchedule->semester_id)
                ->get()
                ->groupBy('pivot.year_level');

            $curriculumSubjectsByYearLevel->each(function (Collection $curriculumSubjects) use ($academicYearSchedule) {
                $curriculumSubjects->each(function (Subject $subject) use ($academicYearSchedule) {
                    $this->subjectClass->factory(fake()->numberBetween(2, 3))
                        ->sequence(function (Sequence $sequence) use ($subject) {
                            $user = User::whereHas('departments', function (Builder $query) use ($subject) {
                                $relationTable = $query->getModel()->getTable();
                                $query->where("$relationTable.id", $subject->department_id);
                            })->get()->random();

                            $creditHours = $subject->pivot->units_lec + $subject->pivot->units_lab;
                            $isAssigned = true;
                            $isSliced = true;

                            $schedule = null;
                            if ($isSliced) {

                                $fakeDaysOptions = fake()->randomElements([
                                    [1, 3, 5],
                                    [2, 4, 6],
                                    [5, 6],
                                ]);

                                $days = [];
                                $options = $fakeDaysOptions[rand(0, count($fakeDaysOptions) - 1)];

                                foreach ($options as $day) {
                                    $days[] = [
                                        'day' => $day,
                                        'duration_in_hours' => $creditHours / count($options),
                                        'start_time' => null,
                                        'resource_id' => null,
                                    ];
                                }

                                $schedule = [
                                    'days' => $days,
                                ];
                            }

                            return [
                                'code' => "$subject->code-".fake()->numerify('###'),
                                'curriculum_subject_id' => $subject->pivot->id,
                                'credit_hours' => $creditHours,
                                'section' => $sequence->index + 1,
                                'is_block' => true,
                                'schedule' => $schedule,
                                'assigned_to_user_id' => $isAssigned ? $user->id : null,
                            ];

                        })
                        ->create([
                            'academic_year_schedule_id' => $academicYearSchedule->id,
                        ]);
                });
            });
        });
    }
}
