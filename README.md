# Little Store

Laravel（API）+ React（SPA）構成のECサイト・ポートフォリオプロジェクトです。会員登録から商品購入・Stripe決済・管理者による商品/注文管理まで、EC_要件定義書に基づく主要機能を一通り実装しています。

## 技術スタック

| 領域 | 技術 |
|---|---|
| バックエンド | PHP 8.4 / Laravel 13 / Laravel Sanctum（トークン認証） |
| フロントエンド | React 19 / TypeScript / Vite / React Router v7 / SCSS Modules |
| DB | MySQL 8 |
| 決済 | Stripe（`stripe-php` SDK直接利用、テストモード） |
| 実行環境 | Docker Compose（backend / frontend / mysql / phpmyadmin） |
| テスト | PHPUnit（バックエンド Feature テスト、53件） |

## 主な機能

### 購入者向け

- 会員登録・ログイン・ログアウト（Sanctumトークン認証）
- 商品一覧（カテゴリ絞り込み・ページネーション）・商品詳細
- カート（追加・数量変更・削除）
- 注文（配送先入力 → Stripeカード決済 → 注文完了）
- マイページ・注文履歴一覧/詳細
- お問い合わせフォーム

### 管理者向け（`role: admin`のユーザーのみ）

- ダッシュボード（今月の売上・注文件数・会員数・在庫切れ件数、直近6か月の売上推移、カテゴリ別売上比率、最近の注文）
- 商品管理（一覧・新規登録・編集・削除、画像アップロード）
- 注文管理（一覧・詳細、ステータスを pending→paid→shipped→completed の順に1段階ずつ進行）

## 前提条件

- Docker Desktop
- Git

## セットアップ

```bash
git clone <このリポジトリ>
cd little-store

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up -d --build
```

初回はイメージのビルドに数分かかります。起動後、以下にアクセスできます。

| URL | 内容 |
|---|---|
| http://localhost:5173 | フロントエンド（React） |
| http://localhost:8000 | バックエンドAPI（Laravel） |
| http://localhost:8081 | phpMyAdmin |

続けて、アプリケーションキーの生成・マイグレーション・ダミーデータ投入を行います。

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

### .env で設定が必要な項目

`backend/.env.example` は Docker 環境に合わせた値が入っていますが、以下は各自の値に差し替えてください（差し替えなくても決済・メール送信以外の機能は動作します）。

| 変数 | 内容 |
|---|---|
| `STRIPE_KEY` / `STRIPE_SECRET` | Stripeのテストモード公開鍵・秘密鍵。未設定時は決済APIが失敗します |
| `MAIL_MAILER` | デフォルトは`log`（`storage/logs/laravel.log`に出力されるだけで実送信されません）。実際にメールを送るには`smtp`等に変更しSMTP系の値を設定してください |
| `MAIL_ADMIN_ADDRESS` | お問い合わせフォーム送信時の通知先メールアドレス |

`frontend/.env.example`の`VITE_STRIPE_KEY`は`backend/.env`の`STRIPE_KEY`と同じ鍵ペア（公開可能キー）を設定してください。

## 動作確認用アカウント

`php artisan migrate --seed` 実行後、以下のアカウントが使えます（パスワードは共通で `password`）。

| メールアドレス | 権限 |
|---|---|
| `admin@example.com` | 管理者（商品/注文管理・ダッシュボードにアクセス可） |
| `test@example.com` | 一般会員 |

Stripe決済のテストには、以下のテストカード番号が使えます（実際の課金は発生しません）。

| 用途 | カード番号 |
|---|---|
| 決済成功 | `4242 4242 4242 4242` |
| 決済失敗（カード拒否） | `4000 0000 0000 0002` |

有効期限は未来の日付、CVCは任意の3桁で構いません。

## テストの実行

```bash
docker compose exec backend php artisan test
```

フロントエンドの型チェック・Lintは以下で実行できます（自動テストは未整備です）。

```bash
docker compose exec frontend npx tsc -b
docker compose exec frontend npx eslint .
```

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `docker compose up -d` | コンテナを起動（バックグラウンド） |
| `docker compose down` | コンテナを停止・削除 |
| `docker compose logs -f backend` | Laravelのログをリアルタイム表示 |
| `docker compose exec backend bash` | backendコンテナの中に入る |
| `docker compose exec backend php artisan migrate:fresh --seed` | テーブルを作り直してダミーデータを投入 |

## プロジェクト構成

```
little-store/
├── docker/                    … 各サービスのDockerfile・起動スクリプト
├── backend/                   … Laravel（API）
│   ├── app/Http/Controllers/  … 購入者向けコントローラー（Admin/配下は管理者向け）
│   ├── app/Http/Requests/     … フォームリクエスト（バリデーション）
│   ├── app/Http/Resources/    … APIレスポンス整形
│   ├── app/Models/            … Eloquentモデル
│   ├── app/Services/          … Stripe決済ゲートウェイ（Mock/実APIの切替）
│   └── tests/Feature/         … APIごとのFeatureテスト
├── frontend/                  … React（SPA）
│   └── src/
│       ├── api/                … axiosベースのAPIクライアント
│       ├── components/         … 共通UIコンポーネント・認証ガード
│       ├── contexts/           … 認証・カートのContext
│       ├── hooks/               … カスタムフック（useAsync等）
│       ├── pages/               … 画面ごとのコンポーネント
│       └── types/               … 型定義
├── document/                  … 要件定義書・設計書（企画時の資料、実装後は更新していません）
└── docker-compose.yml
```

## 既知の制約

- フロントエンドの自動テストは未整備です（バックエンドのFeatureテストのみ）
- 商品削除・画像差し替え時に、不要になった画像ファイルのクリーンアップは行っていません
- 本番デプロイ用の設定（HTTPS、環境変数の秘匿管理、CDN配信など）は含まれていません。あくまでローカル開発環境（Docker Compose）を前提としています
