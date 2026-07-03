# Laravel 13 を動かすため、PHP 8.4 系を使用します
FROM php:8.4-cli-bookworm

# Laravelで必要になりやすいパッケージをインストールします
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

# Composer を使えるようにします
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Laravel起動用スクリプトをコピーします
COPY start.sh /usr/local/bin/start.sh

# 起動スクリプトに実行権限を付けます
RUN chmod +x /usr/local/bin/start.sh

# Laravel の作業ディレクトリです
WORKDIR /var/www/html

# Laravel 開発サーバー用ポートです
EXPOSE 8000

# コンテナ起動時に Laravel を起動します
CMD ["sh", "/usr/local/bin/start.sh"]