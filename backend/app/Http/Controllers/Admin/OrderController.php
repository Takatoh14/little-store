<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OrderUpdateRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    private const STATUS_SEQUENCE = ['pending', 'paid', 'shipped', 'completed'];

    public function index(): AnonymousResourceCollection
    {
        $orders = Order::with('user')->latest()->paginate(20);

        return OrderResource::collection($orders);
    }

    public function update(OrderUpdateRequest $request, Order $order): JsonResponse
    {
        $currentIndex = array_search($order->status, self::STATUS_SEQUENCE, true);
        $newIndex = array_search($request->status, self::STATUS_SEQUENCE, true);

        if ($newIndex !== $currentIndex + 1) {
            return response()->json(['message' => '不正なステータス変更です'], 422);
        }

        $order->update(['status' => $request->status]);

        return response()->json(new OrderResource($order->load('orderItems')));
    }
}
