# Signal Chain Preflight — project cockpit

## North star

「その映像・給電経路は、買う前に成立するか。」を、version labelやconnector形状から推測せず、区間ごとの既知能力・不明能力・方向性から説明可能に判定する。

## Current slice — v0.1.0-alpha.1 released

`v0.1.0-alpha.1` の公開契約を実装し、GitHub Pagesへ配備、exact tagとGitHub prereleaseまで公開済み。単一映像ストリームの線形チェーン、四状態判定、DP / USB-C DP Alt Mode / HDMI TMDS、FRL unresolved、DSC/HDR/VRR、簡易USB PD、URL hash、portable report、Issue導線を含む。

## Acceptance edge

- `EXACT_PASS / CONDITIONAL_PASS / FAIL / INDETERMINATE` がUnknownを潰さず返る
- TMDSの既知不足はFAIL、HDMI FRL精密payload未対応はINDETERMINATE
- UIから入力、診断、proof、share roundtrip、JSON report exportができる
- app/reportがversion、schema、commit、build date、environmentを示す
- clean install、peer、typecheck、lint、unit/coverage、build、desktop/mobile production smokeが成功する
- remote `main`、Actions、Pages、実URL smoke、tag/prereleaseまで事実確認する

## Authority map

- 商品と対象範囲: `docs/product-brief.md`
- 型と判定規則: `docs/domain-model.md`
- 規格定数と出典: `docs/standards-sources.md`
- 安全な仮定と検証待ち: `docs/assumptions.md`
- 公開制約: `docs/known-limitations.md`
- 採用判断: `docs/decision-log.md` と `docs/adr/`
- golden cases: `docs/golden-cases.md` と `src/domain/golden-cases.ts`
- release gate: `docs/release-checklist.md`
- 仕様索引: `docs/spec-index.json`

## Evidence boundary

自動テストとブラウザsmokeは決定論・静的build・主要操作・配信経路の証拠であり、実機のlink training、ケーブル長、信号品質、OS/driver、個別PDO交渉、法的な規格適合、製品型番互換性を保証しない。

## Release verification — 2026-07-19

- Repository: public existing remote、local `main`、初回commit前からrelease candidateを構築
- Safety audit: `.env*`、key-shaped secretなし。生成物と`.serena/`はignore。公開候補の絶対local pathを除去
- Official deployment contract: AstroのGitHub Pages `site` / `base`要件、GitHubのartifact / permissions要件と照合
- Local gates: frozen forced install、peer問題なし、typecheck 0/0/0、lint成功、unit 35/35
- Coverage: statement 88.69%、branch 77.95%、function 95.45%、line 89.61%
- Static production build成功、Chromium desktop/mobile E2E 16/16成功
- Exact app/release commit: `d74b81741a15762e79ad08187fad9b736acdb323`
- GitHub Actions final run 29677035609: build/deploy green
- Public URL: `https://yushimoji.github.io/Signal-Chain-Preflight/` 200、主要asset 200、unknown path 404
- Public URLへ向けたChromium desktop/mobile E2E 16/16成功。version/commit、FRL、Unknown、share、report、404を確認
- Annotated tag / prerelease: `v0.1.0-alpha.1` / `https://github.com/YuShimoji/Signal-Chain-Preflight/releases/tag/v0.1.0-alpha.1`
- GitHub公式action内部のNode.js 20 deprecation annotationは非失敗警告。公式公開workflowのmajor更新時に追従する

## Sync handoff — 2026-07-21

- Purpose: 別端末からの再開に必要なローカル/リモート同期状態と次手順を、chatではなくproject cockpitへ保持する
- Effect: `main` と `origin/main` の一致、公開済みalpha artifact、残作業、最初に読むべきdocsを一箇所で復元できる
- Requirements: repo-local `AGENTS.md`、`docs/project-context.md`、product/domain/standards/assumptions docsを先に読む。公開範囲、owner gate、secrets境界を広げない
- State: `git fetch --prune origin` 後、`main` と `origin/main` は `e4066ed5ff9bebd3c7f4b02ecd97cca23dec2893` で一致。未追跡fileなし。tag `v0.1.0-alpha.1` はapp/release commit `d74b81741a15762e79ad08187fad9b736acdb323` を指す
- Owner: engineering。FRL精密payload、実機妥当性、timing presetの一次資料判断はproduct/owner確認を伴う
- Next move: 変更を始める前に `git status --short --branch`、`git rev-list --left-right --count origin/main...HEAD`、`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm lint` を再実行する

## Residual work

| Purpose | Effect | Requirements | State | Owner | Next move |
| --- | --- | --- | --- | --- | --- |
| Actions runtime annotation追従 | 将来のrunner互換性を維持する | GitHub公式Pages actionのNode 24対応major | non-blocking warning | dependency maintenance | 公式docs更新時にmajorを上げCI確認 |
| 出典付きtiming preset | pixel clock入力負荷と誤入力を減らす | CTA/VESA公開根拠、schema、照合test | 未着手 | product/engineering | 少数の一次資料付きpresetから開始 |
| HDMI FRL精密payload | HDMI高帯域経路を確定診断する | FEC/packet overheadを含む公開一次根拠 | unresolvedとして安全に隔離 | standards research | 公開根拠を得るまでexact値を追加しない |
| 異種transport変換UI | DP→HDMI等の有向adapterをUIで組める | edge transport編集、adapter入出力、組合せE2E | engine/goldenのみ、UIは同一transport中心 | engineering | 次のvertical sliceで方向付きadapter cardを追加 |
| 実機妥当性 | 偽陽性／偽陰性を校正する | 代表機器、同意済み観測、証拠level | 未検証 | product owner / device tester | 公開後に匿名実機case表を設計 |

## Restart

1. `git status --short --branch` と `docs/release-checklist.md` を読む。
2. `pnpm install --frozen-lockfile` からquality gateを再実行する。
3. 公開状態を再監査する場合はtag `v0.1.0-alpha.1` とPages表示commit `d74b817` を照合する。
4. 次sliceは出典付きtiming presetと方向付きadapter UI。
