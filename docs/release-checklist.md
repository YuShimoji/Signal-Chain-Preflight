# Release checklist — v0.1.0-alpha.1

状態: complete — public alpha live and prerelease published（2026-07-19）

## Repository safety

- [x] remote、branch、公開範囲、default branch状態を監査
- [x] `.env*` 未検出、秘密情報らしいtoken/key未検出
- [x] `node_modules/`, `dist/`, `.astro/`, coverage, Playwright生成物をignore
- [x] 公開候補から同一PCの絶対パスを除去
- [x] 最終diffと生成済み`dist/`を再scan

## Product contract

- [x] app version `0.1.0-alpha.1`、schema、commit、build date、environmentを表示
- [x] 対応／非対応範囲をUIとREADMEへ表示
- [x] TMDS不足=`FAIL`、FRL未対応=`INDETERMINATE`、別transportは元判定を変更しない
- [x] report copy / JSON export、Zod validation、ローカルパスmask
- [x] malformed / oversized / unknown-schema hashを安全に拒否
- [x] 4種類のIssue form

## Local quality gates

- [x] clean frozen install / peer check
- [x] typecheck / lint
- [x] unit + coverage（35/35、statement 88.69%、branch 77.95%、function 95.45%、line 89.61%）
- [x] static build
- [x] production Chromium desktop/mobile E2E（16/16）
- [x] secret、absolute path、generated artifact、diff再監査

## GitHub and public URL

- [x] `main`へcommit/push
- [x] Actions validation/deploy green（final app run 29677035609）
- [x] Pages URLが200、assetが200
- [x] desktop/mobileで診断、Unknown、FRL、hash roundtrip、report downloadを確認（live 16/16）
- [x] console error、request failure、document overflowなし
- [x] canonical、OG、favicon、robots、sitemap、404を確認
- [x] tag `v0.1.0-alpha.1` とGitHub prereleaseを公開（exact app commit `d74b81741a15762e79ad08187fad9b736acdb323`）

未完了項目を完了扱いにせず、blockerがある場合はowner、必要設定、正確な再開手順を `docs/project-context.md` に残す。
