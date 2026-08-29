set dotenv-load := false

export PATH := justfile_directory() / "node_modules/.bin" + ":" + env("PATH")

db_name := "2026-mid-add-typing-app-db"

default:
    @just --list

# ローカル開発（ローカル D1）
dev:
    vp dev

# lint / typecheck / test / build
check:
    vp check
    vp test
    vp build

# Cloudflare Workers へデプロイ
deploy: db-generate-sql
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    vp build
    wrangler d1 migrations apply {{ db_name }} --remote
    wrangler d1 execute {{ db_name }} --remote --file=seeds/problems.sql
    wrangler deploy

# ローカル D1 に migration を適用
db-migrate:
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    wrangler d1 migrations apply {{ db_name }} --local

# ローカル D1 に問題データを投入
db-seed: db-generate-sql
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    wrangler d1 execute {{ db_name }} --local --file=seeds/problems.sql

# 本番 D1 に migration を適用
db-migrate-remote:
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    wrangler d1 migrations apply {{ db_name }} --remote

# 本番 D1 に問題データを投入
db-seed-remote: db-generate-sql
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    wrangler d1 execute {{ db_name }} --remote --file=seeds/problems.sql

# 本番 D1 を作成（wrangler login 後）
db-create:
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    wrangler d1 create {{ db_name }}

# problems.json から INSERT OR IGNORE の SQL を生成
db-generate-sql:
    #!/usr/bin/env bash
    set -euo pipefail
    eval "$("$HOME/.vite-plus/bin/vp" env print)"
    node seeds/generate-sql.mjs
