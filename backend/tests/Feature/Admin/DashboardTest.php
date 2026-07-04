<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Contact;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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

    public function test_sales_trend_returns_all_12_months_for_current_year_by_default(): void
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

        $currentMonthIndex = now()->month - 1;

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend');

        $response->assertStatus(200);
        $response->assertJsonPath('granularity', 'month');
        $response->assertJsonPath('year', now()->year);
        $response->assertJsonCount(12, 'periods');
        $response->assertJsonPath('series.0.name', '合計');
        $response->assertJsonPath('series.0.totals.'.$currentMonthIndex, 2000);
        $response->assertJsonPath('series.1.name', $category->name);
        $response->assertJsonPath('series.1.totals.'.$currentMonthIndex, 2000);
    }

    public function test_sales_trend_month_accepts_year_param(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $order = Order::factory()->create(['status' => 'paid', 'total_price' => 2000]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => 1000,
            'quantity' => 2,
        ]);
        DB::table('orders')->where('id', $order->id)->update([
            'created_at' => '2024-03-15 10:00:00',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=month&year=2024');

        $response->assertStatus(200);
        $response->assertJsonPath('year', 2024);
        $response->assertJsonCount(12, 'periods');
        $response->assertJsonPath('periods.2', '3月');
        $response->assertJsonPath('series.0.totals.2', 2000);
    }

    public function test_sales_trend_hour_returns_24_periods_for_specified_date(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $order = Order::factory()->create(['status' => 'paid', 'total_price' => 1000]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_image_url' => $product->image_url,
            'price' => 1000,
            'quantity' => 1,
        ]);
        DB::table('orders')->where('id', $order->id)->update([
            'created_at' => '2024-05-10 14:30:00',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=hour&date=2024-05-10');

        $response->assertStatus(200);
        $response->assertJsonPath('date', '2024-05-10');
        $response->assertJsonCount(24, 'periods');
        $response->assertJsonPath('periods.14', '14時');
        $response->assertJsonPath('series.0.totals.14', 1000);
    }

    public function test_sales_trend_week_returns_monday_to_sunday_for_specified_date(): void
    {
        $admin = User::factory()->admin()->create();

        // 2024-05-10はISOで金曜日。その週の月曜は2024-05-06。
        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=week&date=2024-05-10');

        $response->assertStatus(200);
        $response->assertJsonCount(7, 'periods');
        $response->assertJsonPath('periods.0', '5/6(月)');
        $response->assertJsonPath('periods.6', '5/12(日)');
    }

    public function test_sales_trend_year_range_accepts_custom_range(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=year&start_year=2020&end_year=2023');

        $response->assertStatus(200);
        $response->assertJsonCount(4, 'periods');
        $response->assertJsonPath('periods.0', '2020年');
        $response->assertJsonPath('periods.3', '2023年');
    }

    public function test_sales_trend_year_range_rejects_end_before_start(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=year&start_year=2023&end_year=2020');

        $response->assertStatus(422);
    }

    public function test_sales_trend_year_range_rejects_span_over_50_years(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard/sales-trend?granularity=year&start_year=1900&end_year=2000');

        $response->assertStatus(422);
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
