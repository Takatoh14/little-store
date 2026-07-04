<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $contactCounts = [
            'unread' => Contact::where('status', 'unread')->count(),
            'read' => Contact::where('status', 'read')->count(),
            'answered' => Contact::where('status', 'answered')->count(),
        ];

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
            'contact_counts' => $contactCounts,
            'category_breakdown' => $categoryBreakdown,
            'recent_orders' => OrderResource::collection($recentOrders),
        ]);
    }

    public function salesTrend(Request $request): JsonResponse
    {
        $granularity = $request->string('granularity', 'month')->value();

        if (! in_array($granularity, ['hour', 'week', 'month', 'year'], true)) {
            abort(422, '不正な期間指定です');
        }

        $periods = $this->buildPeriods($granularity);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('orders.status', self::PAID_STATUSES)
            ->where('orders.created_at', '>=', $periods[0]['start'])
            ->select('orders.created_at', 'categories.name as category_name')
            ->selectRaw('order_items.price * order_items.quantity as line_total')
            ->get();

        $categoryNames = Category::pluck('name');

        $seriesTotals = ['合計' => array_fill(0, count($periods), 0)];
        foreach ($categoryNames as $categoryName) {
            $seriesTotals[$categoryName] = array_fill(0, count($periods), 0);
        }

        foreach ($rows as $row) {
            $createdAt = Carbon::parse($row->created_at);
            $periodIndex = null;

            foreach ($periods as $index => $period) {
                if ($createdAt->gte($period['start']) && $createdAt->lt($period['end'])) {
                    $periodIndex = $index;
                    break;
                }
            }

            if ($periodIndex === null) {
                continue;
            }

            $seriesTotals['合計'][$periodIndex] += (int) $row->line_total;
            $seriesTotals[$row->category_name][$periodIndex] += (int) $row->line_total;
        }

        return response()->json([
            'granularity' => $granularity,
            'periods' => array_map(fn ($period) => $period['label'], $periods),
            'series' => collect($seriesTotals)->map(fn ($totals, $name) => [
                'name' => $name,
                'totals' => $totals,
            ])->values(),
        ]);
    }

    /**
     * @return array<int, array{start: Carbon, end: Carbon, label: string}>
     */
    private function buildPeriods(string $granularity): array
    {
        $now = Carbon::now();

        return match ($granularity) {
            'hour' => collect(range(23, 0))->map(function (int $hoursAgo) use ($now) {
                $start = $now->copy()->startOfHour()->subHours($hoursAgo);

                return ['start' => $start, 'end' => $start->copy()->addHour(), 'label' => $start->format('H時')];
            })->values()->all(),
            'week' => collect(range(7, 0))->map(function (int $weeksAgo) use ($now) {
                $start = $now->copy()->startOfWeek()->subWeeks($weeksAgo);

                return ['start' => $start, 'end' => $start->copy()->addWeek(), 'label' => $start->format('n/j').'週'];
            })->values()->all(),
            'year' => collect(range(4, 0))->map(function (int $yearsAgo) use ($now) {
                $start = $now->copy()->startOfYear()->subYears($yearsAgo);

                return ['start' => $start, 'end' => $start->copy()->addYear(), 'label' => $start->format('Y年')];
            })->values()->all(),
            default => collect(range(5, 0))->map(function (int $monthsAgo) use ($now) {
                $start = $now->copy()->startOfMonth()->subMonths($monthsAgo);

                return ['start' => $start, 'end' => $start->copy()->addMonthNoOverflow(), 'label' => $start->format('n月')];
            })->values()->all(),
        };
    }
}
