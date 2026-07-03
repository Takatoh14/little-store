<?php

namespace App\Http\Controllers;

use App\Http\Requests\CartStoreRequest;
use App\Http\Resources\CartItemResource;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    public function store(CartStoreRequest $request): JsonResponse
    {
        $product = Product::findOrFail($request->product_id);

        $cartItem = CartItem::firstOrNew([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $newQuantity = $cartItem->exists
            ? $cartItem->quantity + $request->quantity
            : $request->quantity;

        if ($product->stock < $newQuantity) {
            return response()->json(['message' => '在庫が不足しています'], 422);
        }

        $cartItem->quantity = $newQuantity;
        $cartItem->save();

        return response()->json(new CartItemResource($cartItem->load('product')), 201);
    }
}
