<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fakeSubject = Str::title($this->faker->words(3, true));
        $fakeCode = explode(' ', $fakeSubject);
        $code = $fakeCode[0][0].$fakeCode[1][0].$fakeCode[2][0];
        $title = $fakeSubject;

        return [
            'title' => $title,
            'code' => $code,
        ];
    }
}
