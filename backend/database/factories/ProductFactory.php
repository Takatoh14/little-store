<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private const NAMES = [
        'ノートブック A5', 'ボールペン 3本セット', '色鉛筆12色セット', 'マスキングテープ 5巻セット',
        'ステンレスマグカップ', '保温ポット 1L', '耐熱ガラス保存容器 3点セット', '木製カッティングボード',
        '壁掛け時計 木目調', 'クッションカバー 45×45cm', 'アロマディフューザー', '観葉植物用鉢 Mサイズ',
    ];

    private const DESCRIPTIONS = [
        '毎日の暮らしに寄り添う、丁寧な作りが魅力の一品です。',
        'シンプルなデザインで幅広いシーンに使いやすい商品です。',
        '使うたびに満足感のある、品質にこだわったアイテムです。',
        '贈り物にも自分用にもおすすめの人気商品です。',
    ];

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->randomElement(self::NAMES),
            'description' => fake()->randomElement(self::DESCRIPTIONS),
            'price' => fake()->numberBetween(100, 10000),
            'stock' => fake()->numberBetween(0, 50),
            'image_url' => null,
        ];
    }
}
