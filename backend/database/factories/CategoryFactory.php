<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private const NAMES = ['文房具', 'キッチン雑貨', 'インテリア雑貨', 'アクセサリー', '書籍', 'ファッション雑貨'];

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(self::NAMES),
        ];
    }
}
