<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_succeeds_and_marks_order_paid(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method_id' => 'pm_card_visa',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'succeeded', 'order_id' => $order->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'succeeded']);
    }

    public function test_store_fails_when_card_declined(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/api/payments', [
            'order_id' => $order->id,
            'payment_method_id' => 'pm_card_chargeDeclined',
        ]);

        $response->assertStatus(402);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'failed']);
    }
}
