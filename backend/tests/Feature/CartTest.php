<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_new_cart_item(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $response = $this->actingAs($user)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cart_items', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_store_increments_quantity_for_existing_item(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($user)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('cart_items', 1);
        $this->assertDatabaseHas('cart_items', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);
    }

    public function test_index_lists_only_authenticated_users_items(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        CartItem::factory()->create(['user_id' => $user->id]);
        CartItem::factory()->create(['user_id' => $user->id]);
        CartItem::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/cart');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_update_changes_quantity(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);
        $cartItem = CartItem::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->putJson('/api/cart/'.$cartItem->id, [
            'quantity' => 5,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id, 'quantity' => 5]);
    }

    public function test_update_fails_when_stock_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 3]);
        $cartItem = CartItem::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->putJson('/api/cart/'.$cartItem->id, [
            'quantity' => 10,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => '在庫が不足しています']);
    }

    public function test_update_forbidden_for_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $cartItem = CartItem::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->putJson('/api/cart/'.$cartItem->id, [
            'quantity' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_destroy_removes_item(): void
    {
        $user = User::factory()->create();
        $cartItem = CartItem::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson('/api/cart/'.$cartItem->id);

        $response->assertStatus(204);
        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    public function test_destroy_forbidden_for_other_users_item(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $cartItem = CartItem::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->deleteJson('/api/cart/'.$cartItem->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id]);
    }
}
