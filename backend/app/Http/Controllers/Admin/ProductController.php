<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductStoreRequest;
use App\Http\Requests\Admin\ProductUpdateRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categoryId = $request->query('category_id');

        $products = Product::with('category')
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->paginate(20);

        return ProductResource::collection($products);
    }

    public function store(ProductStoreRequest $request): JsonResponse
    {
        $imageUrl = Storage::disk('public')->url(
            $request->file('image')->store('products', 'public')
        );

        $product = Product::create([
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'image_url' => $imageUrl,
        ]);

        return response()->json(new ProductResource($product->load('category')), 201);
    }

    public function update(ProductUpdateRequest $request, Product $product): JsonResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $data['image_url'] = Storage::disk('public')->url(
                $request->file('image')->store('products', 'public')
            );
        }

        $product->update($data);

        return response()->json(new ProductResource($product->load('category')));
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->orderItems()->exists()) {
            return response()->json(['message' => 'この商品は注文履歴があるため削除できません'], 409);
        }

        $product->delete();

        return response()->json(null, 204);
    }
}
