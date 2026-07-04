<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categoryId = $request->query('category_id');

        $products = Product::with('category')
            ->where('is_published', true)
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->paginate(20);

        return ProductResource::collection($products);
    }

    public function show(Product $product): JsonResponse
    {
        if (! $product->is_published) {
            abort(404);
        }

        return response()->json(new ProductResource($product->load('category')));
    }
}
