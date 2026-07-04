<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OrderUpdateRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    private const STATUS_SEQUENCE = ['pending', 'paid', 'shipped', 'completed'];

    public function index(Request $request): AnonymousResourceCollection
    {
        // 退会済み(ソフトデリート済み)の顧客の注文も、管理画面では引き続き氏名/メールを表示する
        $orders = Order::with(['user' => fn ($query) => $query->withTrashed()])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->boolean('has_cancel_request'), fn ($query) => $query->whereNotNull('cancel_requested_at'))
            ->latest()
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json(new OrderResource($order->load(['orderItems', 'user' => fn ($query) => $query->withTrashed()])));
    }

    public function update(OrderUpdateRequest $request, Order $order): JsonResponse
    {
        if ($order->cancel_requested_at !== null) {
            return response()->json(['message' => 'キャンセル申請の対応を先に行ってください'], 422);
        }

        $currentIndex = array_search($order->status, self::STATUS_SEQUENCE, true);
        $newIndex = array_search($request->status, self::STATUS_SEQUENCE, true);

        if ($newIndex !== $currentIndex + 1) {
            return response()->json(['message' => '不正なステータス変更です'], 422);
        }

        $order->update(['status' => $request->status]);

        return response()->json(new OrderResource($order->load(['orderItems', 'user' => fn ($query) => $query->withTrashed()])));
    }

    public function approveCancel(Order $order): JsonResponse
    {
        if ($order->cancel_requested_at === null) {
            return response()->json(['message' => 'キャンセル申請がありません'], 422);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json(new OrderResource($order->load(['orderItems', 'user' => fn ($query) => $query->withTrashed()])));
    }

    public function rejectCancel(Order $order): JsonResponse
    {
        if ($order->cancel_requested_at === null) {
            return response()->json(['message' => 'キャンセル申請がありません'], 422);
        }

        $order->update(['cancel_requested_at' => null]);

        return response()->json(new OrderResource($order->load(['orderItems', 'user' => fn ($query) => $query->withTrashed()])));
    }
}
