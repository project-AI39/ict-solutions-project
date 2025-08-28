FROM ubuntu:24.04

# 開発用: 1 コンテナ内で Node.js / PostgreSQL / PostGIS / Caddy を同居
# 役割: docker-compose の app サービスのベース。
# 本番移行時は責務分割 (app + db + reverse proxy) を想定。

ENV DEBIAN_FRONTEND=noninteractive \
    NO_UPDATE_NOTIFIER=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /workspace

# ------------------------------------------------------------
# ベースツール層
#   - OS: Ubuntu 24.04 (LTS)
#   - 共通ユーティリティ & ビルドツール
# ------------------------------------------------------------
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release git bash build-essential; \
    rm -rf /var/lib/apt/lists/*

# Node.js (NodeSource) リポジトリ追加 (22.x: 2025 時点 Active / LTS 移行済)
RUN set -eux; \
    mkdir -p /usr/share/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg; \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list

# Node.js 本体インストール
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends nodejs; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

# npm 通知抑止
RUN set -eux; \
    npm config set update-notifier false; \
    npm config set fund false; \
    npm config set audit false

# ------------------------------------------------------------
# PostgreSQL 16 + 基本設定 (開発向け緩い設定)
#   - listen_addresses = '*'
#   - 認証方式: scram-sha-256 (ユーザ作成時のパスワードは entrypoint で指定)
#   - ログ収集有効化
#   単一コンテナ開発用であり本番運用ではコンテナ分離推奨
# ------------------------------------------------------------
RUN set -eux; \
        apt-get update; \
        apt-get install -y --no-install-recommends postgresql-16 postgresql-client-16 postgresql-contrib-16; \
        rm -rf /var/lib/apt/lists/*; \
        sed -i 's/^#port = 5432/port = 5432/' /etc/postgresql/16/main/postgresql.conf; \
        # 開発用: 外部（コンテナ外）接続許可（本番では専用 DB コンテナ推奨） listen_addresses 行のコメント/未コメント両方を * に書き換え
    sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf || true; \
    sed -i "s/^listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf || true; \
        # host all all all の既存設定重複を避けるため先頭一致で確認 (末尾スペース差分回避)
        grep -Eq "^host[[:space:]]+all[[:space:]]+all[[:space:]]+all[[:space:]]+scram-sha-256" /etc/postgresql/16/main/pg_hba.conf || echo 'host all all all scram-sha-256' >> /etc/postgresql/16/main/pg_hba.conf; \
        sed -i 's|^#logging_collector = off|logging_collector = on|' /etc/postgresql/16/main/postgresql.conf; \
        ln -s /usr/lib/postgresql/16/bin/postgres /usr/local/bin/postgres

# PostGIS (地理空間拡張) - 開発時点で有効化してもオーバーヘッドは軽微
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    postgresql-16-postgis-3 postgresql-16-postgis-3-scripts postgis gdal-bin proj-bin; \
    rm -rf /var/lib/apt/lists/*

# Caddy 2.10.* (自動 HTTPS / 逆プロキシ)
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends debian-keyring debian-archive-keyring apt-transport-https curl gnupg ca-certificates; \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg; \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list; \
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends 'caddy=2.10.*'; \
    rm -rf /var/lib/apt/lists/*

# バージョン表示 (ビルドキャッシュ変化検知にも利用)
RUN set -eux; echo "[versions]"; node -v; npm -v; postgres --version; psql --version; caddy version  # キャッシュ破棄の目印にも

# Caddyfile / Entrypoint (infra 下に移動したパスを利用)
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY infra/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 443 3000 5432
# HEALTHCHECK: PostgreSQL と Next.js (3000) の疎通 (Compose でも定義しているためここは任意)
# HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD pg_isready -U postgres -p 5432 && curl -sf http://localhost:3000/ || exit 1
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]