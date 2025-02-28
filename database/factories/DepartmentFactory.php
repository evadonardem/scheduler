<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fakeDepartment = Str::title($this->faker->words(4, true));
        $fakeCode = explode(' ', $fakeDepartment);
        $code = $fakeCode[0][0].$fakeCode[1][0].$fakeCode[2][0].$fakeCode[3][0];
        $title = $fakeDepartment;

        return [
            'code' => $code,
            'title' => $title,
        ];
    }
}
