<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_filters_by_category(): void
    {
        $categoryA = Category::factory()->create();
        $categoryB = Category::factory()->create();

        Product::factory(2)->create(['category_id' => $categoryA->id]);
        Product::factory(3)->create(['category_id' => $categoryB->id]);

        $response = $this->getJson('/api/products?category_id='.$categoryA->id);

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_index_returns_empty_data_for_nonexistent_category(): void
    {
        Product::factory(3)->create();

        $response = $this->getJson('/api/products?category_id=999999');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }
}
