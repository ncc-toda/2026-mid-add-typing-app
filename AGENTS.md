# トラブルベース打

IT エンジニアのチャット返信を打つタイピングゲーム。仕様は [`docs/specs/mvp.md`](docs/specs/mvp.md)。

## 構成

- `src/client/` — React SPA
- `src/worker/` — Hono API（同一 Worker）
- `src/game/` — ローマ字・スコア・統計（純関数）
- `migrations/` — D1 migration
- `seeds/` — MVP 問題データ
- UI の正は仕様 8.2 と `mockups/pattern-b/`

## コマンド

JavaScript ツールは Vite+（`vp`）に任せる。日常操作は just。

```text
just dev          # ローカル開発（ローカル D1）
just check        # lint / typecheck / test / build
just deploy       # Workers へデプロイ
just db-migrate   # ローカル D1 に migration
just db-seed      # ローカル D1 に問題投入
```

`vp install` のあと作業する。`vp check` と `vp test` は `just check` に含まれる。

## Vite+

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs: https://viteplus.dev/guide/

- Run `vp install` after pulling remote changes.
- If setup looks wrong, run `vp env doctor`.

## 制約

- キー入力をプレイ中に都度 API へ送らない
- 個人情報を保存しない
- 不要なライブラリと過剰な抽象化を足さない
