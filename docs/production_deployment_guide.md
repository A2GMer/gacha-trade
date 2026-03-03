# 🚀 ガチャトレード 本番公開（リリース）手順書

このドキュメントは、ローカル環境での開発を終え、Vercelなどの本番サーバーにアプリをデプロイし、一般公開する際に必要な「設定作業」をまとめたものです。

---

## 1. Vercel（ホスティング）側の環境変数設定

Vercelのプロジェクト設定画面（`Settings` > `Environment Variables`）に行き、以下の変数を登録してください。

| 変数名 | 入力する値 | 備考 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseダッシュボードのAPI URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの `anon public` キー | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseの `service_role` キー | **取扱注意（誰にも公開しないでください）** |
| `NEXT_PUBLIC_BASE_URL` | `https://あなたの本番ドメイン.com` | 末尾の `/` は無し。SEOやOGP等で使用 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripeの **「本番環境（ライブモード）」** の公開可能キー | `pk_live_...` から始まります |
| `STRIPE_SECRET_KEY` | Stripeの **「本番環境（ライブモード）」** のシークレットキー | `sk_live_...` から始まります。取扱注意 |
| `RESEND_API_KEY` | （※導入する場合）ResendのAPIキー | メール送信用 |

---

## 2. Supabase側の本番設定

### 2-1. Authentication（認証）ドメインの変更
ローカル開発中は `http://localhost:3000` で認証が通っていましたが、本番ドメインからのアクセスを許可する必要があります。
1. Supabaseダッシュボードの **Authentication > URL Configuration** を開く。
2. **Site URL** を `https://あなたの本番ドメイン.com` に変更。
3. **Redirect URLs** に `https://あなたの本番ドメイン.com/**` を追加。

### 2-2. Storageバケットの作成とRLS
以下の2つのマイグレーションが本番データベースに適用されているか確認してください。
（まだの場合は、SupabaseダッシュボードのSQL Editorから実行してください。ファイル：`supabase/phase2_migration.sql`）
- `avatars` バケット（Public）
- `trade_evidences` バケット（Private）

---

## 3. Stripe側の本番設定

1. Stripeダッシュボード上で、トグルスイッチを「テストモード」からオフにして「本番環境」にします。
2. 本番環境用のAPIキーを発行し、Vercelの環境変数にセットします。
3. デポジット機能が実際に機能するためには、特定商取引法に基づく表記の掲示や、Stripe側でのアカウント情報の審査（本人確認など）を完了させる必要があります。

---

## 4. 最終チェック

1. 本番URLにアクセスし、新規会員登録・ログインができるかテスト。
2. （可能であれば）実際のクレジットカードを使い、少額のデポジット決済が走るかテスト。
3. アイテムの出品、画像アップロードが問題なく行えるかテスト。

以上で本番公開は完了です！🎉
