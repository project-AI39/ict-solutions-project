# ict-solutions-project

「まいぞーん」: 地図型 SNS × イベント共有プラットフォーム。

## 🚀 クイックスタート

```powershell
git clone <REPO_URL>
docker compose up --build
```

アクセス:

- http://localhost:3000 (Next.js dev サーバ)
- https://localhost (Caddy 経由)

## 起動ログの例と成功のサイン

初回は依存関係のインストールや DB 初期化が走るため、数分以上かかる場合があります。以下のようなログが出れば「起動成功」です。

- Prisma のマイグレーションが完了する: `[prisma] migrate deploy done`
- Next.js のアドレスが表示される: `Local:        http://localhost:3000`
- Next.js の準備完了が出る: `✓ Ready in …s`
- ブラウザアクセス後に `GET / 200` が記録される

例（抜粋）:

```
ict-solutions-project  | [postgres] ready
ict-solutions-project  | [prisma] migrate deploy done
ict-solutions-project  |    ▲ Next.js 15.5.2 (Turbopack)
ict-solutions-project  |    - Local:        http://localhost:3000
ict-solutions-project  |    - Network:      http://0.0.0.0:3000
ict-solutions-project  |  ✓ Ready in 44.8s
ict-solutions-project  |  GET / 200 in 1702ms
```

注意:

- この手順はフォアグラウンドでログが流れ続けます。ターミナルを閉じたり Ctrl+C すると停止します。
- 停止したい場合は別ターミナルから `docker compose down` を実行してください。

## アーキテクチャ環境図

![アーキテクチャ環境図](docs/アーキテクチャ環境図.png)

## � 開発時の注意事項

### コード品質チェック

PR作成前やビルド前には必ず以下のコマンドでチェックしてください:

```powershell
# ESLint + TypeScript型チェック
docker exec -it ict-solutions-project bash -c "cd /workspace/web && npm run typecheck && npm run lint"
```

詳細は `docs/環境構築手順.md` の「ビルド前のコード品質チェック」を参照してください。

### 本番ビルド

本番用の最適化されたビルドを実行する場合:

```powershell
.\scripts\prod.ps1
```

開発モードに戻す:

```powershell
.\scripts\dev.ps1
```

## �📄 詳細ドキュメント

- プロジェクト概要: `docs/プロジェクト内容.md`
- 採用技術: `docs/採用技術.md`
- 環境構築: `docs/環境構築手順.md`
- コントリビューションガイド: `docs/CONTRIBUTING.md`
- アーキテクチャ環境図: `docs\アーキテクチャ環境図.drawio`
