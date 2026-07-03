<?php

namespace App\Http\Controllers;

use App\Http\Requests\CartStoreRequest;
use App\Http\Requests\CartUpdateRequest;
use App\Http\Resources\CartItemResource;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CartController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $cartItems = CartItem::where('user_id', $request->user()->id)->with('product')->get();

        return CartItemResource::collection($cartItems);
    }

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

    public function update(CartUpdateRequest $request, CartItem $cartItem): JsonResponse
    {
        if ($cartItem->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($cartItem->product->stock < $request->quantity) {
            return response()->json(['message' => '在庫が不足しています'], 422);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json(new CartItemResource($cartItem->load('product')));
    }

    public function destroy(Request $request, CartItem $cartItem): Response
    {
        if ($cartItem->user_id !== $request->user()->id) {
            abort(403);
        }

        $cartItem->delete();

        return response()->noContent();
    }
}
