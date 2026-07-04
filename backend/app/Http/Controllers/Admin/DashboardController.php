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

    private const WEEKDAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'];

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

        $recentOrders = Order::with(['user' => fn ($query) => $query->withTrashed()])->latest()->take(5)->get();

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

        [$periods, $resolvedParams] = $this->buildPeriods($granularity, $request);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('orders.status', self::PAID_STATUSES)
            ->where('orders.created_at', '>=', $periods[0]['start'])
            ->where('orders.created_at', '<', $periods[count($periods) - 1]['end'])
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

        return response()->json(array_merge([
            'granularity' => $granularity,
            'periods' => array_map(fn ($period) => $period['label'], $periods),
            'series' => collect($seriesTotals)->map(fn ($totals, $name) => [
                'name' => $name,
                'totals' => $totals,
            ])->values(),
        ], $resolvedParams));
    }

    /**
     * @return array{0: array<int, array{start: Carbon, end: Carbon, label: string}>, 1: array<string, mixed>}
     */
    private function buildPeriods(string $granularity, Request $request): array
    {
        return match ($granularity) {
            'hour' => $this->buildHourPeriods($request),
            'week' => $this->buildWeekPeriods($request),
            'month' => $this->buildMonthPeriods($request),
            default => $this->buildYearRangePeriods($request),
        };
    }

    /**
     * @return array{0: array<int, array{start: Carbon, end: Carbon, label: string}>, 1: array<string, mixed>}
     */
    private function buildHourPeriods(Request $request): array
    {
        $date = $this->resolveDate($request->string('date')->value());
        $dayStart = $date->copy()->startOfDay();

        $periods = collect(range(0, 23))->map(function (int $hour) use ($dayStart) {
            $start = $dayStart->copy()->addHours($hour);

            return ['start' => $start, 'end' => $start->copy()->addHour(), 'label' => $start->format('H時')];
        })->values()->all();

        return [$periods, ['date' => $dayStart->format('Y-m-d')]];
    }

    /**
     * @return array{0: array<int, array{start: Carbon, end: Carbon, label: string}>, 1: array<string, mixed>}
     */
    private function buildWeekPeriods(Request $request): array
    {
        $date = $this->resolveDate($request->string('date')->value());
        $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY);

        $periods = collect(range(0, 6))->map(function (int $day) use ($weekStart) {
            $start = $weekStart->copy()->addDays($day);
            $label = $start->format('n/j').'('.self::WEEKDAY_NAMES[$day].')';

            return ['start' => $start, 'end' => $start->copy()->addDay(), 'label' => $label];
        })->values()->all();

        return [$periods, ['date' => $date->format('Y-m-d')]];
    }

    /**
     * @return array{0: array<int, array{start: Carbon, end: Carbon, label: string}>, 1: array<string, mixed>}
     */
    private function buildMonthPeriods(Request $request): array
    {
        $year = (int) $request->input('year', now()->year);

        $periods = collect(range(1, 12))->map(function (int $month) use ($year) {
            $start = Carbon::create($year, $month, 1)->startOfDay();

            return ['start' => $start, 'end' => $start->copy()->addMonthNoOverflow(), 'label' => $month.'月'];
        })->values()->all();

        return [$periods, ['year' => $year]];
    }

    /**
     * @return array{0: array<int, array{start: Carbon, end: Carbon, label: string}>, 1: array<string, mixed>}
     */
    private function buildYearRangePeriods(Request $request): array
    {
        $startYear = (int) $request->input('start_year', now()->year - 4);
        $endYear = (int) $request->input('end_year', now()->year);

        if ($endYear < $startYear || $endYear - $startYear > 50) {
            abort(422, '指定された期間が不正です');
        }

        $periods = collect(range($startYear, $endYear))->map(function (int $year) {
            $start = Carbon::create($year, 1, 1)->startOfDay();

            return ['start' => $start, 'end' => $start->copy()->addYear(), 'label' => $year.'年'];
        })->values()->all();

        return [$periods, ['start_year' => $startYear, 'end_year' => $endYear]];
    }

    private function resolveDate(?string $date): Carbon
    {
        if (! $date) {
            return Carbon::now();
        }

        try {
            return Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
        } catch (\Throwable) {
            abort(422, '不正な日付です');
        }
    }
}
