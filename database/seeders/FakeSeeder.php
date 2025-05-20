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
        $this->department->newQuery()->delete();
        $this->course->newQuery()->delete();
        $this->subject->newQuery()->delete();
        $this->room->newQuery()->delete();
        $this->academicYearSchedule->newQuery()->delete();
        $this->command->info('Cleared departments, courses, subjects, rooms, users, and academic year schedules!');

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
        $defaultUser->assignRole('Faculty');
        $defaultUser->assignRole('Dean');
        $defaultUser->assignRole('Super Admin');

        $this->command->line('Create fake departments, courses, subjects, rooms, and users...');
        $departmentsData = [
            [
                'code' => 'CABM',
                'title' => 'College of Accountancy and Business Management',
            ],
            [
                'code' => 'CIT',
                'title' => 'College of Information Technology',
            ],
            [
                'code' => 'COT',
                'title' => 'College of Theology',
            ],
            [
                'code' => 'CTELA',
                'title' => 'College of Teacher Education and Liberal Arts',
            ],
            [
                'code' => 'CCJE',
                'title' => 'College of Criminal Justice Education',
            ],
            [
                'code' => 'TTED',
                'title' => 'Trade and Technical Education',
            ],
        ];
        $roomsData = [
            'CABM' => [
                [
                    'code' => 'A412',
                    'name' => 'Lecture Room 1',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A416',
                    'name' => 'Lecture Room 2',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A417',
                    'name' => 'Lecture Room 3',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A419',
                    'name' => 'Mock Hotel Rm./Housekeeping',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A420',
                    'name' => 'HRM Bar Laboratory',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A421',
                    'name' => 'Front Office Laboratory',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A604',
                    'name' => 'Lecture Room 4',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A605',
                    'name' => 'Simulation Room',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A606',
                    'name' => 'Lecture Room 5',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E203',
                    'name' => 'Lecture Room 6',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E204',
                    'name' => 'Lecture Room 7',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E205',
                    'name' => 'Lecture Room 8',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E206',
                    'name' => 'Lecture Room 9',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
            ],
            'CIT' => [
                [
                    'code' => 'A301',
                    'name' => 'Lecture Room 1',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A307',
                    'name' => 'Computer Laboratory 1',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A308',
                    'name' => 'Computer Laboratory 2',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A309',
                    'name' => 'Computer Laboratory 3',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A310',
                    'name' => 'Computer Laboratory 4',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A311',
                    'name' => 'Computer Laboratory 5',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A322',
                    'name' => 'Computer Technology Lab',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A323',
                    'name' => 'Computer Tech. Stock and Tool Room',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A324',
                    'name' => 'Computer Laboratory 6',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A608',
                    'name' => 'Lecture Room 10',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E209',
                    'name' => 'Lecture Room 11',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E210',
                    'name' => 'Lecture Room 12',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
            ],
            'COT' => [
                [
                    'code' => 'X101',
                    'name' => 'Lecture Room 1',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'X102',
                    'name' => 'Lecture Room 2',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
            ],
            'CCJE' => [
                [
                    'code' => 'A111',
                    'name' => 'Lecture Room 1',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A112',
                    'name' => 'Lecture Room 2',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A113',
                    'name' => 'Lecture Room 3',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A114',
                    'name' => 'Lecture Room 4',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A401',
                    'name' => 'Lecture Room 5',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A410',
                    'name' => 'Lecture Room 6',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A411',
                    'name' => 'Lecture Room 7',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A414',
                    'name' => 'Chemistry Laboratory',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A501',
                    'name' => 'Lecture Room 8',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A502',
                    'name' => 'Lecture Room 9',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A503',
                    'name' => 'Lecture Room 10',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A504',
                    'name' => 'Lecture Room 11',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A505',
                    'name' => 'Lecture Room 12',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A508',
                    'name' => 'CCJE Office',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A509',
                    'name' => 'CCJE Office and Laboratory',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A510',
                    'name' => 'CCJE Laboratory',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A511',
                    'name' => 'CCJE SBO Office',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A603',
                    'name' => 'Lecture Room 13',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'C107',
                    'name' => 'CCJE Stock Room',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
            ],
            'CTELA' => [
                [
                    'code' => 'A115-A',
                    'name' => 'Lecture Room 1',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A115-C',
                    'name' => 'Lecture Room 2',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A115-D',
                    'name' => 'Lecture Room 3',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A116',
                    'name' => 'Lecture Room 4',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A117',
                    'name' => 'Lecture Room 5',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A118',
                    'name' => 'Lecture Room 6',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A121',
                    'name' => 'Lecture Room 7',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A122',
                    'name' => 'Lecture Room 8',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A123',
                    'name' => 'PE Room',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A124',
                    'name' => 'PE Room',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A514-A',
                    'name' => 'Learning Resource Center',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A514-B',
                    'name' => 'Speech Laboratory',
                    'is_lec' => true,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A515',
                    'name' => 'HRM Stock Room',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A516',
                    'name' => 'HRM Hot Kitchen',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A517',
                    'name' => 'HRM Cold Kitchen',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A518',
                    'name' => 'Laundry Laboratory',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'A521',
                    'name' => 'Lecture Room 9',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'A607',
                    'name' => 'Lecture Room 10',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E207',
                    'name' => 'Lecture Room 11',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
                [
                    'code' => 'E208',
                    'name' => 'Lecture Room 12',
                    'is_lec' => true,
                    'is_lab' => false,
                ],
            ],
            'TTED' => [
                [
                    'code' => 'A415',
                    'name' => 'Health Care Services Lab',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
                [
                    'code' => 'D113',
                    'name' => 'Driving Room',
                    'is_lec' => false,
                    'is_lab' => true,
                ],
            ],
        ];
        $departments = $this->department
            ->factory(count($departmentsData))
            ->sequence(fn (Sequence $sequence) => [
                'code' => $departmentsData[$sequence->index]['code'],
                'title' => $departmentsData[$sequence->index]['title'],
            ])
            ->has(
                $this->course->factory(1)
            )
            ->has(
                $this->subject->factory(50)
            )
            ->create();
        $departments->each(function (Department $department) use ($roomsData) {
            // Rooms
            $this->room->factory(count($roomsData[$department->code]))
                ->sequence(fn (Sequence $sequence) => [
                    'code' => $roomsData[$department->code][$sequence->index]['code'],
                    'name' => $roomsData[$department->code][$sequence->index]['name'],
                    'is_lec' => $roomsData[$department->code][$sequence->index]['is_lec'],
                    'is_lab' => $roomsData[$department->code][$sequence->index]['is_lab'],
                ])
                ->create([
                    'default_owner_department_id' => $department->id,
                ]);

            // Faculties
            $users = $this->user->factory(8)->create([
                'password' => Hash::make('123456'),
            ]);
            $users->each(function (User $user) use ($department) {
                $user->departments()->attach($department);
                $user->assignRole('Faculty');
            });

            // Dean
            $user = $this->user->factory()->create([
                'password' => Hash::make('123456'),
            ]);
            $user->departments()->attach($department);
            $user->assignRole('Faculty');
            $user->assignRole('Dean');

            // Associate Dean
            $user = $this->user->factory()->create([
                'password' => Hash::make('123456'),
            ]);
            $user->departments()->attach($department);
            $user->assignRole('Faculty');
            $user->assignRole('Associate Dean');
        });
        $this->command->info('Done! Fake departments, courses, subjects, rooms, and users created.');

        $this->command->line('Create fake curriculums...');
        $this->course->newQuery()->get()->each(function (Course $course) use ($defaultUser) {
            $curriculum = $this->curriculum->factory()->create([
                'course_id' => $course->id,
                'is_active' => true,
                'is_draft' => false,
                'created_by' => $defaultUser->id,
            ]);

            foreach (range(1, 2) as $semesterId) {
                foreach (range(1, 4) as $yearLevel) {
                    $curriculumSubjectIds = $curriculum->fresh()->subjects->pluck('id')->toArray();
                    $subjects = Subject::where('department_id', $course->department_id)
                        ->whereNotIn('id', $curriculumSubjectIds)
                        ->inRandomOrder()
                        ->limit(fake()->numberBetween(3, 5))
                        ->get();

                    $subjectsData = $subjects->mapWithKeys(function (Subject $subject) use ($defaultUser, $semesterId, $yearLevel) {
                        return [
                            $subject->id => [
                                'year_level' => $yearLevel,
                                'semester_id' => $semesterId,
                                'units_lec' => fake()->numberBetween(1, 5),
                                'units_lab' => fake()->numberBetween(1, 5),
                                'credit_hours' => fake()->numberBetween(3, 6),
                                'created_by' => $defaultUser->id,
                                'created_at' => now(),
                            ],
                        ];
                    });

                    $curriculum->subjects()->attach($subjectsData);
                }
            }
        });
        $this->command->info('Done! Fake curriculums created.');

        foreach (range(1, 2) as $semesterId) {
            $this->command->line('Create fake academic year schedule');
            $academicYearSchedule = $this->academicYearSchedule->factory()->create([
                'academic_year' => '2024-2025',
                'semester_id' => $semesterId,
                'start_date' => $semesterId == 1 ? '2024-06-01' : '2025-01-01',
                'end_date' => $semesterId == 1 ? '2024-12-31' : '2025-04-30',
            ]);
            $this->command->info('Done! Fake academic year schedule created.');

            $this->command->line('Create fake subject classes');
            Curriculum::all()->each(function (Curriculum $curriculum) use ($academicYearSchedule) {
                $curriculumSubjectsByYearLevel = $curriculum->subjects()
                    ->wherePivot('semester_id', $academicYearSchedule->semester_id)
                    ->get()
                    ->groupBy('pivot.year_level');

                $curriculumSubjectsByYearLevel->each(function (Collection $curriculumSubjects) use ($academicYearSchedule) {
                    $sectionsCount = fake()->numberBetween(2, 3);
                    $curriculumSubjects->each(function (Subject $subject) use ($academicYearSchedule, $sectionsCount) {
                        $this->subjectClass->factory($sectionsCount)
                            ->sequence(function (Sequence $sequence) use ($subject) {
                                $user = User::whereHas('departments', function (Builder $query) use ($subject) {
                                    $relationTable = $query->getModel()->getTable();
                                    $query->where("$relationTable.id", $subject->department_id);
                                })->get()->random();

                                $creditHours = $subject->pivot->credit_hours;
                                $isAssigned = fake()->boolean();
                                $isSliced = fake()->boolean();

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
                                    'code' => "$subject->code-".fake()->numerify('####'),
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
            $this->command->info('Done! Fake subject classes created.');
            $defaultUser->departments()->sync(Department::where('code', 'CIT')->first()->id);
        }
    }
}
