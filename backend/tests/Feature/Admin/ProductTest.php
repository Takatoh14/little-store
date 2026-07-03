<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_product(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'テスト商品',
            'category_id' => $category->id,
            'price' => 1500,
            'stock' => 20,
            'description' => '説明文',
            'image' => UploadedFile::fake()->image('product.jpg'),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', [
            'name' => 'テスト商品',
            'category_id' => $category->id,
        ]);
    }

    public function test_non_admin_cannot_create_product(): void
    {
        Storage::fake('public');

        $customer = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/admin/products', [
            'name' => 'テスト商品',
            'category_id' => $category->id,
            'price' => 1500,
            'stock' => 20,
            'image' => UploadedFile::fake()->image('product.jpg'),
        ]);

        $response->assertStatus(403);
    }

    public function test_create_product_fails_without_image(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'テスト商品',
            'category_id' => $category->id,
            'price' => 1500,
            'stock' => 20,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('image');
    }
}
