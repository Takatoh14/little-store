#!/bin/sh

# エラーが発生したら処理を停止します
set -e

# Laravelプロジェクトのディレクトリへ移動します
cd /var/www/html

# .env がなければ .env.example から作成します
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# vendor/autoload.php がなければ Composer 依存関係をインストールします
# vendor フォルダの有無ではなく autoload.php の有無で判定します
if [ ! -f vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    composer install
fi

# APP_KEY が未生成なら作成します
if ! grep -q "^APP_KEY=base64:" .env; then
    echo "Generating Laravel APP_KEY..."
    php artisan key:generate --force
fi

# Laravelの設定キャッシュをクリアします
php artisan config:clear

# Laravelの開発サーバーを起動します
php artisan serve --host=0.0.0.0 --port=8000