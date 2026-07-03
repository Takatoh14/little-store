<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_all_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        Order::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/orders');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.user.email', $customer->email);
    }

    public function test_non_admin_cannot_list_orders(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/admin/orders');

        $response->assertStatus(403);
    }

    public function test_admin_can_advance_status_pending_to_paid(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->putJson('/api/admin/orders/'.$order->id, [
            'status' => 'paid',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
    }

    public function test_admin_cannot_skip_status(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->putJson('/api/admin/orders/'.$order->id, [
            'status' => 'shipped',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']);
    }

    public function test_admin_cannot_revert_status(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->putJson('/api/admin/orders/'.$order->id, [
            'status' => 'pending',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
    }

    public function test_non_admin_cannot_update_status(): void
    {
        $customer = User::factory()->create();
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($customer)->putJson('/api/admin/orders/'.$order->id, [
            'status' => 'paid',
        ]);

        $response->assertStatus(403);
    }
}
