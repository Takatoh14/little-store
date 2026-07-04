<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        // emailの単純unique制約だと退会(ソフトデリート)済みの行がメールアドレスを
        // 占有し続けてしまい再登録できないため、(email, deleted_at)の複合uniqueに変更する。
        // NULLは互いに重複と見なされないため、有効な行(deleted_at=NULL)は引き続き1件に制限しつつ、
        // 退会済みの行は各々異なるdeleted_atを持つので共存できる。
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
            $table->unique(['email', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email', 'deleted_at']);
            $table->unique('email');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
