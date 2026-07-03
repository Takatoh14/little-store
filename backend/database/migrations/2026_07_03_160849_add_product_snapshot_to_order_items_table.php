<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->after('product_id');
            $table->string('product_image_url')->nullable()->after('product_name');
        });

        // DB非依存(MySQL/SQLiteとも動く)のバックフィルのためJOIN更新ではなく製品ごとに更新する
        DB::table('products')->select('id', 'name', 'image_url')->orderBy('id')->each(function (object $product) {
            DB::table('order_items')
                ->where('product_id', $product->id)
                ->whereNull('product_name')
                ->update([
                    'product_name' => $product->name,
                    'product_image_url' => $product->image_url,
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['product_name', 'product_image_url']);
        });
    }
};
