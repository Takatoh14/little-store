<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Contact;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_dashboard_summary(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory(2)->create();

        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'price' => 1000, 'stock' => 0]);

        $paidOrder = Order::factory()->create(['status' => 'paid', 'total_price' => 3000]);
        OrderItem::create([
            'order_id' => $paidOrder->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => 1000,
            'quantity' => 3,
        ]);

        Order::factory()->create(['status' => 'pending', 'total_price' => 5000]);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
        $response->assertJsonPath('monthly_sales', 3000);
        $response->assertJsonPath('monthly_order_count', 1);
        $response->assertJsonPath('member_count', 4);
        $response->assertJsonPath('out_of_stock_count', 1);
        $response->assertJsonPath('category_breakdown.0.category_name', $category->name);
        $response->assertJsonPath('category_breakdown.0.total', 3000);
        $response->assertJsonPath('contact_counts.unread', 0);
        $response->assertJsonCount(2, 'recent_orders');
    }

    public function test_non_admin_cannot_view_dashboard(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_dashboard_includes_contact_counts(): void
    {
        $admin = User::factory()->admin()->create();
        Contact::factory()->create(['status' => 'unread']);
        Contact::factory(2)->create(['status' => 'read']);
        Contact::factory(3)->create(['status' => 'answered']);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
        $response->assertJsonPath('contact_counts.unread', 1);
        $response->assertJsonPath('contact_counts.read', 2);
        $response->assertJsonPath('contact_counts.answered', 3);
    }

    public function test_sales_trend_returns_monthly_periods_by_default(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $order = Order::factory()->create(['status' => 'paid']);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => 1000,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend');

        $response->assertStatus(200);
        $response->assertJsonPath('granularity', 'month');
        $response->assertJsonCount(6, 'periods');
        $response->assertJsonPath('series.0.name', '合計');
        $response->assertJsonPath('series.0.totals.5', 2000);
        $response->assertJsonPath('series.1.name', $category->name);
        $response->assertJsonPath('series.1.totals.5', 2000);
    }

    public function test_sales_trend_supports_other_granularities(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (['hour', 'week', 'month', 'year'] as $granularity) {
            $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity='.$granularity);
            $response->assertStatus(200);
            $response->assertJsonPath('granularity', $granularity);
        }
    }

    public function test_sales_trend_rejects_invalid_granularity(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=invalid');

        $response->assertStatus(422);
    }

    public function test_non_admin_cannot_view_sales_trend(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)->getJson('/api/admin/dashboard/sales-trend')->assertStatus(403);
    }
}
