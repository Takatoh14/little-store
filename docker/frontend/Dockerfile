# React + Vite を動かすための Node.js 環境です
FROM node:22-alpine

# コンテナ内の作業ディレクトリです
WORKDIR /app

# Vite の開発サーバー用ポートです
EXPOSE 5173

# 依存関係をインストールしてから Vite を起動します
# node_modules は Docker volume 側に作成されます
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]