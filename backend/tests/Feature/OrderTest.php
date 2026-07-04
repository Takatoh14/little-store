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
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => 500,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($user)->getJson('/api/orders/'.$order->id);

        $response->assertStatus(200);
        $response->assertJsonPath('items.0.product_id', $product->id);
        $response->assertJsonPath('items.0.product_name', $product->name);
    }

    public function test_show_returns_404_for_other_users_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/orders/'.$order->id);

        $response->assertStatus(404);
    }

    public function test_complete_succeeds_for_shipped_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'shipped']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/complete');

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'completed']);
    }

    public function test_complete_fails_for_non_shipped_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'paid']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/complete');

        $response->assertStatus(422);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
    }

    public function test_complete_fails_for_other_users_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $otherUser->id, 'status' => 'shipped']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/complete');

        $response->assertStatus(404);
    }

    public function test_complete_requires_authentication(): void
    {
        $order = Order::factory()->create(['status' => 'shipped']);

        $this->postJson('/api/orders/'.$order->id.'/complete')->assertStatus(401);
    }

    public function test_request_cancel_succeeds_for_pending_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'pending']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/cancel-request');

        $response->assertStatus(200);
        $this->assertNotNull($order->refresh()->cancel_requested_at);
    }

    public function test_request_cancel_succeeds_for_paid_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'paid']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/cancel-request');

        $response->assertStatus(200);
        $this->assertNotNull($order->refresh()->cancel_requested_at);
    }

    public function test_request_cancel_fails_for_shipped_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'shipped']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/cancel-request');

        $response->assertStatus(422);
        $this->assertNull($order->refresh()->cancel_requested_at);
    }

    public function test_request_cancel_fails_when_already_requested(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'paid',
            'cancel_requested_at' => now(),
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/cancel-request');

        $response->assertStatus(422);
    }

    public function test_request_cancel_fails_for_other_users_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $otherUser->id, 'status' => 'pending']);

        $response = $this->actingAs($user)->postJson('/api/orders/'.$order->id.'/cancel-request');

        $response->assertStatus(404);
    }

    public function test_request_cancel_requires_authentication(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $this->postJson('/api/orders/'.$order->id.'/cancel-request')->assertStatus(401);
    }
}
