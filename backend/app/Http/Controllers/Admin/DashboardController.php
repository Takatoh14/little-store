<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    private const PAID_STATUSES = ['paid', 'shipped', 'completed'];

    public function index(): JsonResponse
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();

        $monthlySales = (int) Order::whereIn('status', self::PAID_STATUSES)
            ->where('created_at', '>=', $monthStart)
            ->sum('total_price');

        $monthlyOrderCount = Order::whereIn('status', self::PAID_STATUSES)
            ->where('created_at', '>=', $monthStart)
            ->count();

        $memberCount = User::where('role', 'customer')->count();

        $outOfStockCount = Product::where('stock', 0)->count();

        $salesTrend = collect(range(5, 0))->map(function (int $monthsAgo) use ($now) {
            $monthDate = $now->copy()->subMonths($monthsAgo);
            $total = Order::whereIn('status', self::PAID_STATUSES)
                ->whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->sum('total_price');

            return [
                'month' => $monthDate->format('Y-m'),
                'total' => (int) $total,
            ];
        })->values();

        $categoryBreakdown = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('orders.status', self::PAID_STATUSES)
            ->selectRaw('categories.name as category_name, SUM(order_items.price * order_items.quantity) as total')
            ->groupBy('categories.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category_name' => $row->category_name,
                'total' => (int) $row->total,
            ]);

        $recentOrders = Order::with('user')->latest()->take(5)->get();

        return response()->json([
            'monthly_sales' => $monthlySales,
            'monthly_order_count' => $monthlyOrderCount,
            'member_count' => $memberCount,
            'out_of_stock_count' => $outOfStockCount,
            'sales_trend' => $salesTrend,
            'category_breakdown' => $categoryBreakdown,
            'recent_orders' => OrderResource::collection($recentOrders),
        ]);
    }
}
