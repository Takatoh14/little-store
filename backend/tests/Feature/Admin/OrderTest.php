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

    public function test_admin_can_still_see_withdrawn_customer_name_on_order_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $customer->id]);
        $customer->delete();

        $response = $this->actingAs($admin)->getJson('/api/admin/orders/'.$order->id);

        $response->assertStatus(200);
        $response->assertJsonPath('user.email', $customer->email);
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

    public function test_admin_can_view_any_order_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $customer->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/orders/'.$order->id);

        $response->assertStatus(200);
        $response->assertJsonPath('id', $order->id);
        $response->assertJsonPath('user.email', $customer->email);
    }

    public function test_non_admin_cannot_view_admin_order_detail(): void
    {
        $customer = User::factory()->create();
        $order = Order::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/admin/orders/'.$order->id);

        $response->assertStatus(403);
    }

    public function test_admin_can_filter_orders_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        Order::factory()->create(['status' => 'pending']);
        Order::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->getJson('/api/admin/orders?status=paid');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'paid');
    }

    public function test_admin_can_filter_orders_by_cancel_request(): void
    {
        $admin = User::factory()->admin()->create();
        Order::factory()->create(['status' => 'pending']);
        Order::factory()->create(['status' => 'pending', 'cancel_requested_at' => now()]);

        $response = $this->actingAs($admin)->getJson('/api/admin/orders?has_cancel_request=1');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_admin_can_approve_cancel_request(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'paid', 'cancel_requested_at' => now()]);

        $response = $this->actingAs($admin)->postJson('/api/admin/orders/'.$order->id.'/approve-cancel');

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'cancelled']);
    }

    public function test_admin_can_reject_cancel_request(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'paid', 'cancel_requested_at' => now()]);

        $response = $this->actingAs($admin)->postJson('/api/admin/orders/'.$order->id.'/reject-cancel');

        $response->assertStatus(200);
        $order->refresh();
        $this->assertNull($order->cancel_requested_at);
        $this->assertSame('paid', $order->status);
    }

    public function test_approve_cancel_fails_when_no_request_exists(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->postJson('/api/admin/orders/'.$order->id.'/approve-cancel');

        $response->assertStatus(422);
    }

    public function test_reject_cancel_fails_when_no_request_exists(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->postJson('/api/admin/orders/'.$order->id.'/reject-cancel');

        $response->assertStatus(422);
    }

    public function test_non_admin_cannot_approve_or_reject_cancel(): void
    {
        $customer = User::factory()->create();
        $order = Order::factory()->create(['status' => 'paid', 'cancel_requested_at' => now()]);

        $this->actingAs($customer)->postJson('/api/admin/orders/'.$order->id.'/approve-cancel')->assertStatus(403);
        $this->actingAs($customer)->postJson('/api/admin/orders/'.$order->id.'/reject-cancel')->assertStatus(403);
    }

    public function test_admin_cannot_advance_status_while_cancel_requested(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'pending', 'cancel_requested_at' => now()]);

        $response = $this->actingAs($admin)->putJson('/api/admin/orders/'.$order->id, [
            'status' => 'paid',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']);
    }
}
