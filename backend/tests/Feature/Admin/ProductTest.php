<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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

    public function test_admin_can_list_products(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/products');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_non_admin_cannot_list_products(): void
    {
        $customer = User::factory()->create();
        Product::factory(3)->create();

        $response = $this->actingAs($customer)->getJson('/api/admin/products');

        $response->assertStatus(403);
    }

    public function test_admin_can_update_product(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['name' => '旧商品名']);

        $response = $this->actingAs($admin)->post('/api/admin/products/'.$product->id, [
            '_method' => 'PUT',
            'name' => '新商品名',
            'category_id' => $category->id,
            'price' => 2000,
            'stock' => 10,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => '新商品名']);
    }

    public function test_updating_product_without_image_keeps_existing_image_url(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['image_url' => '/storage/products/original.jpg']);

        $response = $this->actingAs($admin)->post('/api/admin/products/'.$product->id, [
            '_method' => 'PUT',
            'name' => '更新後商品名',
            'category_id' => $category->id,
            'price' => 2000,
            'stock' => 10,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'image_url' => '/storage/products/original.jpg',
        ]);
    }

    public function test_non_admin_cannot_update_product(): void
    {
        $customer = User::factory()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($customer)->post('/api/admin/products/'.$product->id, [
            '_method' => 'PUT',
            'name' => '新商品名',
            'category_id' => $category->id,
            'price' => 2000,
            'stock' => 10,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_product_without_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($admin)->deleteJson('/api/admin/products/'.$product->id);

        $response->assertStatus(204);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_admin_cannot_delete_product_with_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();
        $order = Order::factory()->create();
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => $product->price,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($admin)->deleteJson('/api/admin/products/'.$product->id);

        $response->assertStatus(409);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_non_admin_cannot_delete_product(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($customer)->deleteJson('/api/admin/products/'.$product->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
