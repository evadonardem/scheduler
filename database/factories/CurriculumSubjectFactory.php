<?php

namespace Database\Factories;

use App\Models\Semester;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CurriculaSubject>
 */
class CurriculumSubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'semester_id' => Semester::all()->random()->id,
            'units_lec' => fake()->numberBetween(1, 5),
            'units_lab' => fake()->numberBetween(1, 5),
        ];
    }
}
