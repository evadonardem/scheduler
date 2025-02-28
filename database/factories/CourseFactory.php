<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fakeCourse = Str::title($this->faker->words(3, true));
        $fakeCode = explode(' ', $fakeCourse);
        $code = 'BS'.$fakeCode[0][0].$fakeCode[1][0].$fakeCode[2][0];
        $title = 'Bachelor of Science in '.$fakeCourse;

        return [
            'title' => $title,
            'code' => $code,
        ];
    }
}
