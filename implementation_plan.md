# フェーズ6: 取引フローの厳格化とUI改善プラン

ユーザーからのフィードバックに基づき、以下の機能追加および改修を行います。

## 1. データベースの拡張 (supabase/migrations/xxx_updates.sql 等)
**目的**: アイテムの状態管理、住所のアカウント毎の保存、通知機能の実現、取引状態の細分化。
- **`user_items` テーブル**:
  - `status` カラムを追加（`AVAILABLE`, `TRADING`, `COMPLETED`）。デフォルトは `AVAILABLE`。
- **`user_addresses` テーブル (新規)**:
  - ユーザーごとのデフォルト住所を保存。`user_id` (PK), `name`, `postal_code`, `prefecture`, `city`, `line1`, `line2`, `phone`。（必要に応じて暗号化）
- **`trades` テーブル**:
  - 発送・受取状態の個別フラグを追加: `proposer_shipped`, `receiver_shipped`, `proposer_received`, `receiver_received` (BOOLEAN DEFAULT FALSE)
- **`notifications` テーブル (新規)**:
  - `id`, `user_id`, `type` (proposal, message, status, system), `title`, `body`, `related_id` (trade_id 等), `is_read`, `created_at`
- **DBトリガーの作成**:
  - 取引ステータス変更時（ACCEPTED, CANCELLED, COMPLETED）に、紐づく `user_items` の `status` を自動更新するトリガー。
  - メッセージ送信時やステータス変更時に `notifications` へ自動INSERTするトリガー。

## 2. アイテム一覧の表示修正 (トップ / 検索 / ユーザーページ)
**目的**: 取引が成立したものを一覧から消し、手続き中のものを分かりやすくする。
- `status = 'COMPLETED'` のアイテムはクエリで除外（非表示）。
- `status = 'TRADING'` のアイテムは表示するが、画像上に「交換手続き中」のバッジをオーバーレイ表示。クリック時も提案ボタンは非活性にする。

## 3. チャット画面/提案の単一化 (Trade Room)
**目的**: 双方が提案を出し合って別々のチャットができるのを防ぐ。
- `trade/propose/page.tsx` で提案を送信する際、既に「同じ2人のユーザー間」かつ「同じ2つのアイテム」に関する有効な取引（CANCELLED/COMPLETED以外）が存在するかチェック。
- 存在する場合は、新規作成せずに既存の取引ルーム (`trade/[id]`) へリダイレクトする。

## 4. 通知画面の実装 (notifications/page.tsx)
**目的**: 最新のお知らせをDBからリアルタイム（または都度ロード）で表示。
- ハードコードされているリストを廃止し、`notifications` テーブルからデータを取得・表示。
- 「すべて既読にする」機能と未読バッジの実装。

## 5. 取引ルームの手続き化 (メルカリ風フロー)
**目的**: チャット空間での取引をより厳格なステップで誘導する。
- **STEP 1: 提案 (PROPOSED)**
  - 提案側: 「相手の返答を待っています」
  - 受信側: 「承諾する」「辞退する」ボタン
- **STEP 2: 住所確認 (ACCEPTED / PREPARING)**
  - 双方がまず自分の住所を確認・登録するUIを表示（未登録なら `user_addresses` へ保存）。
  - 双方が住所を確定すると、互いの住所が開示される。
- **STEP 3: 発送 (SHIPPING)**
  - 相手の住所が表示され「発送を通知する」ボタンが出現。
  - 押下すると自分の `_shipped` フラグがTRUEに。
- **STEP 4: 受取確認 (RECEIVING)**
  - 相手から発送通知が来たら「受取を確認した」ボタンを表示。
  - 押下すると自分の `_received` フラグがTRUEに。双方が完了すると `COMPLETED` となり取引終了。

以上の設計で進めてよろしいでしょうか？
