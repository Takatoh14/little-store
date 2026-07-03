<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderStoreRequest;
use App\Http\Resources\OrderResource;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(OrderStoreRequest $request): JsonResponse
    {
        $user = $request->user();

        $cartItems = CartItem::where('user_id', $user->id)->with('product')->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'カートが空です'], 422);
        }

        $insufficientProductIds = $cartItems
            ->filter(fn (CartItem $item) => $item->product->stock < $item->quantity)
            ->pluck('product_id')
            ->values();

        if ($insufficientProductIds->isNotEmpty()) {
            return response()->json([
                'message' => '一部商品の在庫が不足しています',
                'errors' => ['product_id' => $insufficientProductIds],
            ], 422);
        }

        $order = DB::transaction(function () use ($user, $cartItems, $request) {
            $productIds = $cartItems->pluck('product_id');
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            foreach ($cartItems as $cartItem) {
                if ($products[$cartItem->product_id]->stock < $cartItem->quantity) {
                    throw ValidationException::withMessages([
                        'product_id' => '一部商品の在庫が不足しています',
                    ]);
                }
            }

            $totalPrice = $cartItems->sum(fn (CartItem $item) => $products[$item->product_id]->price * $item->quantity);

            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'shipping_address' => $request->postal_code.' '.$request->address,
                'phone' => $request->phone,
            ]);

            foreach ($cartItems as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'price' => $products[$cartItem->product_id]->price,
                    'quantity' => $cartItem->quantity,
                ]);

                $products[$cartItem->product_id]->decrement('stock', $cartItem->quantity);
            }

            CartItem::where('user_id', $user->id)->delete();

            return $order;
        });

        return response()->json(new OrderResource($order->load('orderItems')), 201);
    }
}
