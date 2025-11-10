# コントリビューションガイド

このドキュメントはチーム開発を円滑に進めるための最小ルール集です。段階的に拡張します。

## コミットメッセージルール

チームで一貫した履歴を残し、レビュー効率・変更理由の追跡性・自動化（CHANGELOG 生成等）の向上を目的とします。

## 基本フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`: 下表から 1 つ（必須）
- `scope`: 影響範囲（任意 / 小文字ケバブ例: api, auth, ui, prisma, infra など）
- `subject`: 50 文字（全角 25 文字）程度を目安に簡潔。末尾に句点は不要。動詞は「〜する/追加」「Add/Fix」など。
- `body`: なぜ / 何を / どう解決したか。複数段落可。実装詳細より “意図” を優先。 箇条書き可。
- `footer`: 破壊的変更や関連 Issue/タスク ID。`BREAKING CHANGE:` で始める。`Closes #123` など。

### 最小例

```
✨ feat: ダッシュボードカード表示ロジックを追加
```

scope 使用例（任意）:

```
✨ feat(api): ダッシュボードカード表示ロジックを追加
```

> 絵文字は視認性向上用の“装飾”であり内部的な type は `feat` / `fix` などの英小文字。自動処理（Conventional Commits 互換ツール等）では絵文字を除去して解釈する想定。

### 体裁ルール

- 行頭/行末に空白を残さない。
- Subject は **一行**、Markdown 記号は不要。
- 日本語/英語は混在可だが主語冗長化は避ける。
- WIP（`🚧 wip`）は個人ブランチのみ。`main` に残さない。
- (推奨) 1 行目は 72 文字以内（CLI / Git log 折り返し対策）。

### 粒度

- 1 コミット = 1 意図（単一のバグ修正 / 機能 / リファクタ）。
- 無関係な整形・依存更新を混在させない（フォーマットだけなら分離）。
- 300〜400 行規模や論点が増えたら早めに分割 / PR。

## type 一覧

| 絵文字+種別 | 説明                 | 主な用途例                             | Prefix 英語例   |
| ----------- | -------------------- | -------------------------------------- | --------------- |
| ✨ feat     | 新機能追加           | 新しいページ / API エンドポイント      | Add, Implement  |
| 🐛 fix      | バグ修正             | Null 参照修正 / 境界条件修正           | Fix, Prevent    |
| 📝 docs     | ドキュメントのみ     | README, ADR, コメント                  | Update docs     |
| 🎨 style    | 動作に影響のない書式 | フォーマット / セミコロン / 命名       | Format          |
| ♻️ refactor | リファクタ           | 関数抽出 / 責務分離                    | Refactor        |
| ⚡️ perf    | パフォーマンス改善   | クエリ最適化 / キャッシュ              | Optimize        |
| ✅ test     | テスト関連           | ユニットテスト追加 / 修正              | Add tests       |
| 👷 build    | ビルド関連           | 依存更新 / bundler 設定                | Configure build |
| 💚 ci       | CI 変更              | GitHub Actions / Pipeline              | Adjust CI       |
| 🔧 chore    | その他雑多           | バージョン上げ / スクリプト            | Chore           |
| ⏪️ revert  | Revert               | 誤ったリリース取り消し                 | Revert          |
| 🚧 wip      | 作業途中             | 下書き・共有用（push 可 / merge 不可） | WIP             |

> `🚧 wip` は squash 時に他 type に置き換えるか、削除する。

## 例

```
🐛 fix: ユーザー削除時に関連レコードが残る問題を解消

Closes #154
```

```
♻️ refactor: トークン検証ロジックを関数抽出

- 重複していた try/catch を共通化
- 例外メッセージを統一
```

```
⚡️ perf(db): 重いダッシュボード集計をキャッシュ 5 分導入

初回 1200ms → 210ms（ローカル計測）。
BREAKING CHANGE: 旧エンドポイント /v1/stats を廃止。
```

```
⏪️ revert: ✨ feat(api): レートリミット実装

パフォーマンス劣化と 429 誤発生のため一旦戻す。関連 Issue #203 を再オープン。
```

## BREAKING CHANGE の扱い

破壊的変更がある場合:

1. Footer に `BREAKING CHANGE:` を追加
2. Body で移行手順 (migration) を明示
3. 影響範囲（利用者 / 環境変数 / スキーマ）を列挙
4. （任意）SemVer 次バージョン影響を明記 (例: “次回 minor → major”)。

## VS Code commit-message-editor 用設定例

`.vscode/settings.json` かユーザー設定に追加:

```jsonc
"commit-message-editor.tokens": [
  {
    "label": "種類",
    "name": "type",
    "type": "enum",
    "options": [
      { "label": "---", "value": "" },
      { "label": "✨ feat", "value": "✨ feat", "description": "新しい機能の追加" },
      { "label": "🐛 fix", "value": "🐛 fix", "description": "バグや不具合の修正" },
      { "label": "📝 docs", "value": "📝 docs", "description": "ドキュメントやコメントの追加・修正" },
      { "label": "🎨 style", "value": "🎨 style", "description": "コードの書式や見た目の変更（動作に影響なし）" },
      { "label": "♻️ refactor", "value": "♻️ refactor", "description": "機能や動作を変えずにコードを整理・改善" },
      { "label": "⚡️ perf", "value": "⚡️ perf", "description": "処理速度や効率の改善" },
      { "label": "✅ test", "value": "✅ test", "description": "テストコードの追加・修正" },
      { "label": "👷 build", "value": "👷 build", "description": "ビルドツールや外部依存などビルド関連の変更" },
      { "label": "💚 ci", "value": "💚 ci", "description": "CI（継続的インテグレーション）設定や自動化スクリプトの変更" },
      { "label": "🔧 chore", "value": "🔧 chore", "description": "その他の雑多な変更（設定ファイルの編集など）" },
      { "label": "⏪️ revert", "value": "⏪️ revert", "description": "過去のコミットの取り消し" },
      { "label": "---", "value": "" },
      { "label": "🚧 wip", "value": "🚧 wip", "description": "作業途中や一時保存のコミット（mainには残さない）" }
    ],
    "description": "このコミットで行った変更の種類"
  }
]
```

---

## コード品質チェック

PR作成前およびコミット前に、必ず以下のコマンドでコードの品質をチェックしてください。

### 前提条件

開発コンテナが起動していることを確認してください:

```powershell
docker ps | findstr ict-solutions-project
```

### チェックコマンド

#### ESLint チェック（コーディング規約）

```powershell
docker exec -it ict-solutions-project bash -c "cd /workspace/web && npm run lint"
```

- コーディング規約違反、未使用変数、潜在的なバグなどをチェック
- **エラー・警告がゼロであることが必須**

#### TypeScript 型チェック

```powershell
docker exec -it ict-solutions-project bash -c "cd /workspace/web && npm run typecheck"
```

- 型の不一致、未定義の変数、型推論の問題などをチェック
- **エラーがゼロであることが必須**

#### 両方を一度に実行

```powershell
docker exec -it ict-solutions-project bash -c "cd /workspace/web && npm run typecheck && npm run lint"
```

### チェック失敗時の対応

1. **ESLint エラー**:
   - エラーメッセージのファイル名と行番号を確認
   - 該当箇所を修正（未使用変数の削除、コーディング規約の遵守など）
   - 再度 `npm run lint` を実行して確認

2. **TypeScript エラー**:
   - 型エラーのメッセージを確認
   - 該当箇所の型定義を修正
   - 再度 `npm run typecheck` を実行して確認

3. **すべてのチェックがパスするまで修正を繰り返す**

### PR作成時のチェックリスト

- [ ] `npm run typecheck` がエラーなしで完了
- [ ] `npm run lint` がエラー・警告なしで完了
- [ ] 開発環境で動作確認済み
- [ ] 可能であれば本番ビルド（`.\scripts\prod.ps1`）でも動作確認

### 自動化（推奨）

Git hooks（husky など）を使用して、コミット前に自動チェックを実行することを推奨します（今後導入予定）。

---

## ブランチ運用ルール

ブランチ名の一貫性と可読性を高め、自動化・検索・トレーサビリティを向上させることを目的とします。

### 目的

- 変更意図をブランチ名から瞬時に把握
- 衝突・巨大 PR の発生抑制
- Issue / タスクとの追跡容易化
- CI / スクリプトでの分岐を簡潔に

### 基本形

```
<type>/<kebab-description>
```

拡張形（Issue / 外部チケットを含める場合）:

```
<type>/<issue>/<kebab-description>
```

例: `feat/PROJ-123/add-login-endpoint`

### 命名ルール

| 項目        | ルール                                                                |
| ----------- | --------------------------------------------------------------------- |
| 文字種      | ASCII 小文字 / 数字 / ハイフンのみ (a-z 0-9 -)                        |
| 禁止        | スペース・絵文字(gitmoji)・非 ASCII・アンダースコア・連続ハイフン     |
| description | 3〜6 語程度の短い kebab-case。冗長語 (add-new, feature-など) を避ける |
| issue 部    | (任意) `PROJ-123` や `123` など既存トラッカー ID                      |
| 長さ        | 50 文字程度を上限目安                                                 |
| 種別語彙    | コミット type と同一セットを使用                                      |

### type 語彙 / 定義

| type     | 説明                                    |
| -------- | --------------------------------------- |
| feat     | 新機能の追加・変更                      |
| fix      | バグ修正                                |
| docs     | ドキュメント変更                        |
| style    | 振る舞いに影響しない書式変更            |
| refactor | 機能を変えない構造改善                  |
| perf     | パフォーマンス改善                      |
| test     | テスト追加・修正                        |
| build    | ビルド/依存の変更                       |
| ci       | CI 設定・自動化変更                     |
| chore    | その他雑多な変更                        |
| revert   | 変更の取り消し (一時対応)               |
| wip      | 作業途中 (短期・個人向け / PR 前に整理) |
| release  | リリース用 (例: `release/v1.2.0`)       |

### 例

| 目的                   | ブランチ名例                    |
| ---------------------- | ------------------------------- |
| ログイン API 追加      | `feat/add-login-endpoint`       |
| モバイルでナビ崩れ修正 | `fix/navbar-overflow-on-mobile` |
| Auth サービス分割      | `refactor/split-auth-service`   |
| 認証テスト追加         | `test/add-auth-guard-specs`     |
| CI キャッシュキー調整  | `ci/update-cache-key`           |
| リリース準備 1.2.0     | `release/v1.2.0`                |
| 作業途中 (短期)        | `wip/ui-theme-cleanup`          |

### 注意事項

- ブランチ名に絵文字 (gitmoji) は使用しない（CLI / URL / CI 条件式の安定性向上）。
- `wip/` ブランチは 24〜48h 内に整理し、最終 PR では意味のある type に置き換える（squash 時 fixup で削除）。
- `revert/` は例外的運用。恒常的なメンテナンスは `fix/` や `chore/` に再分類。
- `release/` はタグ付与 (`vMAJOR.MINOR.PATCH`) の直前に使用し、マージ後削除可。

### 主ブランチ

- `main`: 常にデプロイ可能 (Green)。

### 粒度

- 1 タスク = 1 ブランチ原則
- 500+ 行 / 50+ ファイルに達しそうなら分割 or 早期 PR
