<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_succeeds_and_empties_cart(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10, 'price' => 1000]);
        CartItem::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'postal_code' => '1234567',
            'address' => '東京都〇〇区〇〇1-2-3',
            'phone' => '090-1234-5678',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 8]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'price' => 1000,
            'quantity' => 2,
        ]);
    }

    public function test_store_fails_when_stock_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 1]);
        CartItem::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'postal_code' => '1234567',
            'address' => '東京都〇〇区〇〇1-2-3',
            'phone' => '090-1234-5678',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 1]);
        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_store_fails_when_cart_is_empty(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'postal_code' => '1234567',
            'address' => '東京都〇〇区〇〇1-2-3',
            'phone' => '090-1234-5678',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => 'カートが空です']);
    }

    public function test_index_lists_only_authenticated_users_orders(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Order::factory(2)->create(['user_id' => $user->id]);
        Order::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/orders');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_show_returns_own_order_with_items(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);
        $order->orderItems()->create([
            'product_id' => $product->id,
            'price' => 500,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($user)->getJson('/api/orders/'.$order->id);

        $response->assertStatus(200);
        $response->assertJsonPath('items.0.product_id', $product->id);
    }

    public function test_show_returns_404_for_other_users_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/orders/'.$order->id);

        $response->assertStatus(404);
    }
}
