#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# コンテナ起動シーケンス (開発用 単一コンテナ)
#   1. PostgreSQL 起動 & 初回初期化 (DB/ROLE, PostGIS 拡張)
#   2. Prisma migrate deploy (失敗時 db push) / 依存インストール
#   3. Next.js dev server (バックグラウンド) 起動
#   4. Caddy (フォアグラウンド) 起動 -> PID 1 としてシグナル受領
# 備考: 本番では DB / アプリ / Caddy を分離し systemd 的責務分割を推奨
# ------------------------------------------------------------

echo "[entrypoint] start container startup sequence"

PG_VERSION=16
PG_CLUSTER=main
PG_CTL="pg_ctlcluster ${PG_VERSION} ${PG_CLUSTER}"  # Debian 系 PostgreSQL のクラスタ操作ラッパ

# 環境変数 (docker-compose で上書き可)
DB_NAME="${DB_NAME:-appdb}"           # docker-compose.yml で上書き可
DB_USER="${DB_USER:-appuser}"
DB_PASS="${DB_PASS:-appsecret}"
POSTGIS_ENABLE="${POSTGIS_ENABLE:-1}"  # 0: PostGIS 拡張無効 (軽量化)

echo "[postgres] starting cluster" 
${PG_CTL} start

echo "[postgres] waiting for readiness"
for i in {1..30}; do
  if pg_isready -q -d postgres -U postgres; then
    echo "[postgres] ready"; break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo "[postgres] failed to become ready" >&2
    exit 1
  fi
done

INIT_MARKER="/var/lib/postgresql/${PG_VERSION}/.app-initialized"
PSQL="runuser -u postgres -- psql"
DB_BOOT_MODE="${DB_BOOT_MODE:-persist}"  # persist / always-reset
echo "[mode] DB_BOOT_MODE=$DB_BOOT_MODE"

# 1. ロールと DB が無ければ作る (両モード共通で最初に保証)
ESCAPED_PASS=${DB_PASS//\'/''}
if ! $PSQL -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  echo "[init] create role ${DB_USER}"
  $PSQL -c "CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${ESCAPED_PASS}';"
fi
if ! $PSQL -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "[init] create database ${DB_NAME}"
  $PSQL -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
fi
if [[ "$POSTGIS_ENABLE" != "0" ]]; then
  echo "[init] enable postgis"
  $PSQL -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS postgis;" || echo "[postgis] failed to create extension" >&2
fi

# 2. モードごとの挙動
RUN_MIGRATIONS=0
RUN_SEED=0
if [[ "$DB_BOOT_MODE" == "always-reset" ]]; then
  echo "[mode] always-reset: drop & recreate database then seed"
  # 既存接続切断して DROP
  $PSQL -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" || true
  $PSQL -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
  $PSQL -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  if [[ "$POSTGIS_ENABLE" != "0" ]]; then
    $PSQL -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS postgis;" || echo "[postgis] failed to create extension" >&2
  fi
  RUN_MIGRATIONS=1
  RUN_SEED=1
else
  if [[ ! -f "$INIT_MARKER" ]]; then
    echo "[mode] persist first run: mark initialized & seed"
    RUN_MIGRATIONS=1
    RUN_SEED=1
    touch "$INIT_MARKER"
  else
    echo "[mode] persist reuse existing data (migrate only)"
    RUN_MIGRATIONS=1
    RUN_SEED=0
  fi
fi

# Prisma マイグレーション（存在する場合）
if [[ -f /workspace/web/package.json ]]; then
  pushd /workspace/web >/dev/null
  if [[ ! -d node_modules ]]; then
    echo "[node] install dependencies"
    npm install --no-audit --no-fund
  fi
  # Ensure DATABASE_URL (fallback if not supplied via env)
  if [[ -z "${DATABASE_URL:-}" ]]; then
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
  fi
  if grep -q "prisma" package.json 2>/dev/null && [[ -f prisma/schema.prisma ]]; then
    # ローカルインストール優先 (node_modules/.bin)
    if [[ -x node_modules/.bin/prisma ]]; then
      PRISMA_CMD="npx prisma"
    else
      # fallback (初回インストールがまだのケース)
      PRISMA_CMD="npx --yes prisma"
    fi
    if [[ "$RUN_MIGRATIONS" == "1" ]]; then
      echo "[prisma] migrate deploy (with auto-fix for schema mismatch)"
      
      # まず migrate status で状態確認
      MIGRATE_STATUS_OUTPUT=$(${PRISMA_CMD} migrate status 2>&1 || true)
      
      # migrate deploy を試行
      DEPLOY_SUCCESS=0
      if ${PRISMA_CMD} migrate deploy 2>&1; then
        echo "[prisma] migrate deploy succeeded"
        DEPLOY_SUCCESS=1
      else
        echo "[prisma] migrate deploy failed, diagnosing..."
        
        # 不整合を検出（マイグレーションファイルとスキーマの不一致）
        if echo "$MIGRATE_STATUS_OUTPUT" | grep -qi "drift\|out of sync\|baseline"; then
          echo "[prisma] detected schema drift or baseline issue"
          echo "[prisma] attempting migrate resolve --applied for existing migrations"
          
          # 既存マイグレーションを適用済みとしてマーク（空の migrations フォルダ対策）
          for migration_dir in prisma/migrations/*/; do
            if [[ -d "$migration_dir" ]]; then
              migration_name=$(basename "$migration_dir")
              ${PRISMA_CMD} migrate resolve --applied "$migration_name" 2>&1 || true
            fi
          done
        fi
      fi
      
      # マイグレーションが成功しても、ファイルが不完全な可能性があるため db push で完全同期
      # （開発環境ではマイグレーションファイルとスキーマの不一致がよく発生する）
      echo "[prisma] running db push to ensure complete schema sync (dev safety)"
      if ${PRISMA_CMD} db push --accept-data-loss 2>&1; then
        echo "[prisma] db push succeeded - schema fully synchronized"
      else
        echo "[prisma] db push failed, trying force reset (WARNING: may lose data)"
        ${PRISMA_CMD} db push --force-reset --accept-data-loss 2>&1 || {
          echo "[prisma] ERROR: All migration attempts failed. Manual intervention required." >&2
          echo "[prisma] Suggestion: Check DATABASE_URL and prisma/schema.prisma for errors" >&2
        }
      fi
    else
      echo "[prisma] skip migrations (RUN_MIGRATIONS=0)"
    fi
    echo "[prisma] generate client"
    ${PRISMA_CMD} generate || echo "[prisma] generate failed (non-fatal)"
    
    if [[ "$RUN_SEED" == "1" ]]; then
      echo "[prisma] seed start"
      
      # シード前に念のため再生成（マイグレーション後のスキーマ変更を確実に反映）
      ${PRISMA_CMD} generate >/dev/null 2>&1 || true
      
      if ${PRISMA_CMD} db seed 2>&1; then
        echo "[prisma] seed completed successfully"
      else
        SEED_EXIT=$?
        echo "[prisma] seed failed (exit code: $SEED_EXIT)" >&2
        echo "[prisma] This is non-fatal but indicates data may not be seeded." >&2
        echo "[prisma] Common causes: missing tables, constraint violations, or seed script errors" >&2
      fi
    else
      echo "[prisma] seed skipped (RUN_SEED=0)"
    fi
  fi
  # NODE_ENV に応じて起動モード切替
  NODE_ENV="${NODE_ENV:-development}"
  echo "[next] NODE_ENV=$NODE_ENV"
  
  if [[ "$NODE_ENV" == "production" ]]; then
    echo "[next] building for production..."
    npm run build
    
    echo "[next] starting production server (background)"
    npm run start &
    NEXT_PID=$!
  else
    echo "[next] starting dev server (background)"
    npm run dev &
    NEXT_PID=$!
  fi
  
  # Caddy 終了時に Next.js を明示停止 (不要ゾンビ防止)
  trap 'echo "[next] stopping (pid=$NEXT_PID)"; kill $NEXT_PID 2>/dev/null || true' EXIT INT TERM
  popd >/dev/null
else
  echo "[warn] /workspace/web/package.json not found; skipping Next.js"
fi

echo "[caddy] preparing config"
if [[ -z "${DOMAIN:-}" ]]; then
  # DOMAIN 未設定時は production 用ブロック ({$DOMAIN} { ... }) を削除した一時ファイルを生成
  awk 'BEGIN{skip=0} /^\{\$DOMAIN\} \{/ {skip=1} skip && /^}/ {skip=0; next} skip {next} {print}' \
    /etc/caddy/Caddyfile > /etc/caddy/Caddyfile.effective
  CADDY_CFG=/etc/caddy/Caddyfile.effective
  echo "[caddy] DOMAIN not set -> production block removed"
else
  CADDY_CFG=/etc/caddy/Caddyfile
fi

echo "[caddy] starting (foreground)"
exec caddy run --config "$CADDY_CFG" --adapter caddyfile