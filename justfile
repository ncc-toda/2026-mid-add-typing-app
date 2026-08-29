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
deploy:
    vp build
    wrangler d1 migrations apply {{ db_name }} --remote
    wrangler d1 execute {{ db_name }} --remote --file=seeds/problems.sql
    wrangler deploy

# ローカル D1 に migration を適用
db-migrate:
    wrangler d1 migrations apply {{ db_name }} --local

# ローカル D1 に問題データを投入
db-seed:
    wrangler d1 execute {{ db_name }} --local --file=seeds/problems.sql

# 本番 D1 に migration を適用
db-migrate-remote:
    wrangler d1 migrations apply {{ db_name }} --remote

# 本番 D1 に問題データを投入
db-seed-remote:
    wrangler d1 execute {{ db_name }} --remote --file=seeds/problems.sql

# 本番 D1 を作成（wrangler login 後）
db-create:
    wrangler d1 create {{ db_name }}
