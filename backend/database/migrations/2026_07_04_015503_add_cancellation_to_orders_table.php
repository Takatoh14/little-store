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
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('cancel_requested_at')->nullable()->after('status');
        });

        // statusにcancelledを追加するため、enumではなく素のVARCHARに変更する
        // (許可値はFormRequest側のin:ルールで検証済み)。ドライバごとに手段が異なる。
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('status_tmp', 20)->default('pending')->after('cancel_requested_at');
            });
            DB::statement('UPDATE orders SET status_tmp = status');
            Schema::table('orders', function (Blueprint $table) {
                // statusを含む複合インデックスが張られているため、列を消す前にインデックスを外す
                $table->dropIndex(['user_id', 'status']);
                $table->dropColumn('status');
            });
            Schema::table('orders', function (Blueprint $table) {
                $table->renameColumn('status_tmp', 'status');
            });
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['user_id', 'status']);
            });
        } else {
            DB::statement("ALTER TABLE orders MODIFY status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('cancel_requested_at');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','paid','shipped','completed') NOT NULL DEFAULT 'pending'");
        }
    }
};
