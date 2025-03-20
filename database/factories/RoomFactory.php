<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Room>
 */
class RoomFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->randomLetter().fake()->numerify('#####'),
            'name' => fake()->words(3, true),
            'is_lec' => fake()->boolean(),
            'is_lab' => fake()->boolean(),
        ];
    }
}
