# Little Store — 環境構築手順

このREADMEは、EC_基本設計書に基づいて用意したDocker環境のセットアップ手順です。上から順番に実行してください。

## 前提条件

- Docker Desktop がインストール済みであること
- Git がインストール済みであること

## 0. このフォルダの中身

```
little-store/
├── docker/
│   ├── backend/Dockerfile    … Laravel実行環境の定義
│   ├── backend/start.sh      … backendコンテナの起動スクリプト
│   ├── frontend/Dockerfile   … React(Vite)実行環境の定義
│   └── mysql/
│       ├── Dockerfile
│       ├── conf.d/my.cnf     … データベースの文字コード設定
│       └── init/01-init.sql  … 初期化用SQL
├── backend/                  … Laravel（作成済み）
├── frontend/                 … React（作成済み）
├── docker-compose.yml
└── .gitignore
```

以下の手順1・3（Laravel/Reactプロジェクトの作成）は既に完了しています。初めてこの環境を構築する場合の手順として残していますが、既存の`backend/`・`frontend/`をそのまま使う場合はステップ4から進めてください。

## 1. Laravelプロジェクトを作成する

`backend/` フォルダの中に、Laravel本体を作成します。

```bash
cd little-store

docker run --rm -v "$(pwd)/backend:/app" -w /app composer create-project laravel/laravel .
```

しばらく待つと、`backend/` フォルダの中にLaravelのファイル一式が生成されます。

> 💡 **初心者向け解説**: `docker run --rm ...` は、Composer（PHPのパッケージ管理ツール）が入った一時的なコンテナを起動して、`backend/`フォルダの中にLaravelの雛形を作らせるコマンドです。`--rm`が付いているので、作業が終わるとこのコンテナ自体は自動的に消えます。

## 2. .env ファイルを作成する

```bash
cp backend/.env.example backend/.env
```

コピーした `backend/.env` を開き、内容を確認してください（用意した`.env.example`はDocker環境に合わせた値が既に入っています）。

## 3. Reactプロジェクトを作成する

`frontend/` フォルダの中に、React + TypeScriptのプロジェクトを作成します。

```bash
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:22-alpine \
  npm create vite@latest . -- --template react-ts
```

途中で上書き確認を聞かれた場合は `y` を選択してください。

## 4. Dockerコンテナを起動する

```bash
docker compose up -d --build
```

初回はイメージのビルドに数分かかります。起動後、以下にアクセスできれば成功です。

| URL | 内容 |
|---|---|
| http://localhost:8000 | Laravel（バックエンド API） |
| http://localhost:5173 | React（フロントエンド開発サーバー） |
| http://localhost:8081 | phpMyAdmin |

## 5. Laravelの初期設定を行う

コンテナが起動した状態で、以下を実行します。

```bash
# アプリケーションキーの生成（.envのAPP_KEYが設定されます）
docker compose exec backend php artisan key:generate

# Sanctum（認証機能）のインストール
docker compose exec backend php artisan install:api

# マイグレーションの実行（現時点ではLaravel標準テーブルのみ。EC固有テーブルは次のステップで追加）
docker compose exec backend php artisan migrate
```

> 💡 **初心者向け解説**: `docker compose exec backend ...` は、既に起動しているbackendコンテナ（Laravel）の中でコマンドを実行する、という意味です。`artisan`はLaravelに標準で付いてくる便利なコマンドラインツールで、テーブル作成やキャッシュのクリアなど、開発でよく使う作業をコマンド一つで行えます。
>
> `install:api` の実行後、案内に従って `app/Models/User.php` に `Laravel\Sanctum\HasApiTokens` トレイトを追加してください。

## 6. 動作確認

- ブラウザで `http://localhost:8000` を開き、Laravelのウェルカムページが表示されればOKです
- `http://localhost:5173` を開き、Viteのデフォルト画面が表示されればOKです
- `http://localhost:8081` でphpMyAdminにアクセスできればOKです
- `docker compose exec mysql mysql -u laravel -psecret little_store -e "SHOW TABLES;"` でテーブル一覧が確認できればDB接続もOKです

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `docker compose up -d` | コンテナを起動（バックグラウンド） |
| `docker compose down` | コンテナを停止・削除 |
| `docker compose logs -f backend` | Laravelのログをリアルタイム表示 |
| `docker compose exec backend bash` | backendコンテナの中に入る |
| `docker compose exec backend php artisan migrate:fresh --seed` | テーブルを作り直してダミーデータを投入 |

## 次のステップ

環境構築が完了したら、EC_詳細設計書の「処理フロー」を参考に、Controller・Model・マイグレーションファイルの実装（詳細設計フェーズの続き）に進みます。
