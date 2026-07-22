# Supervisor AI handoff — 2026-07-23

## Mission

Signal Chain Preflightは、PC・ゲーム機・dock・adapter・cable・displayからなる映像/給電経路を、connector形状やversion labelから推測せず、区間ごとの既知能力、Unknown、方向、出典から購入前に説明可能に判定するbrowser-only utilityである。

監修役の第一責務は機能数を増やすことではなく、`EXACT_PASS / CONDITIONAL_PASS / FAIL / INDETERMINATE` の意味、Unknown伝播、一次根拠、実機保証外の境界を崩さずに次sliceを承認すること。

## Read order and authority

1. repo-local `AGENTS.md`
2. `docs/project-context.md`
3. `docs/product-brief.md`
4. `docs/domain-model.md`
5. `docs/standards-sources.md`
6. `docs/assumptions.md`
7. 本書
8. `docs/roadmap.md`、`docs/decision-log.md`、`docs/idea-ledger.md`

競合した場合は上のauthorityと、より狭いdomain文書を優先する。`src/domain/` はdeterministicかつUI-independentに保つ。

## Executive status

- Product: `v0.1.0-alpha.1` public alphaはrelease済み。単一映像streamの線形chain、DP、USB-C DP Alt Mode、HDMI TMDS、FRL unresolved、DSC/HDR/VRR、簡易USB PD、share hash、portable JSON reportを提供する。
- Repository: public `YuShimoji/Signal-Chain-Preflight`、default branch `main`。2026-07-23に `git fetch --prune --tags` と `git pull --ff-only origin main` を実行し、報告作成前baselineはlocal/remoteとも `1e62e1a2e8ae1671716f6e52403c7187380a5a4d`。開始時worktreeはclean。
- Release artifact: tag `v0.1.0-alpha.1` とprereleaseは `d74b81741a15762e79ad08187fad9b736acdb323` のapp artifactを表す。後続 `main` はdocs-onlyのためPagesを再buildしていない。
- Hosting: GitHub Pages workflow、public、HTTPS enforced。最新app deploy run `29677035609` はsuccess。
- Live URL: `https://yushimoji.github.io/Signal-Chain-Preflight/` は2026-07-23にHTTP 200、app titleを確認。実URLdesktop/mobile E2Eは16件、終了code 0。
- Development environment: Node `v24.13.0`、pnpm `11.9.0`。`package.json` のNode 24/pnpm 11契約とpackageManager pinに適合。
- Recommended next slice: 出典付きtiming presetと方向付きadapter UIを一つのvertical sliceとして実装する。HDMI 2.2、USB4、MSTは混ぜない。

## Verification evidence — 2026-07-23

| Gate | Result | Evidence |
| --- | --- | --- |
| Remote sync | pass | fetch/prune/tags、ff-only pull=`Already up to date`、baseline `origin/main...HEAD`=`0 0` |
| Frozen dependency install | pass | `pnpm install --frozen-lockfile`=`Already up to date` |
| Peer compatibility | pass | `pnpm peers check`=`No peer dependency issues found` |
| Typecheck | pass | `pnpm typecheck`, exit 0 |
| Lint | pass | `pnpm lint`, exit 0 |
| Unit/coverage | pass | 6 files、35/35 tests。statements 88.69%、branches 77.95%、functions 95.45%、lines 89.61% |
| Static build | pass | Astro static build、1 page、exit 0 |
| Local production E2E | pass | Playwright desktop/mobile、16 tests、exit 0 |
| GitHub release state | pass | public repo、release prerelease、Pages workflow run success |
| Live smoke/E2E | pass | HTTP 200、desktop/mobile 16 tests、exit 0 |

Non-blocking observations:

- pnpmは11.16.0のupdateを案内するが、repoは再現性のため11.9.0をpinしている。maintenance slice以外で上げない。
- Playwright/preview中に `NO_COLOR` が `FORCE_COLOR` により無視されるwarningが出る。test failure、product defect、判定品質の証拠ではない。
- GitHub Pages APIの `status` はworkflow buildでnullだが、workflow success、HTTP 200、live E2Eを個別に確認している。

Roadmap source refresh:

- HDMI 2.2の最大96 Gbps/Ultra96、USB4の最大80 Gbps、DP 2.1bのactive cableは公式公開情報で存在を再確認したが、現行engineへ安全に写像できる精密payload/allocation modelの証拠にはしない。詳細は `docs/standards-sources.md` のroadmap source watchを参照する。
- AccessibilityはW3C RecommendationのWCAG 2.2をM1の監査基準候補とする: https://www.w3.org/TR/WCAG22/ 。自動testだけでconformanceを宣言せず、manual evidenceと対象levelを明記する。

## Implementation map

| Area | Authority / entrypoint | Current role |
| --- | --- | --- |
| Domain schemas/types | `src/domain/schemas.ts`, `src/domain/types.ts` | Unknownを含むinput/report contract |
| Deterministic evaluation | `src/domain/evaluate.ts`, `math.ts`, `power.ts` | bandwidth、feature continuity、power、proof、fallback |
| Public constants/sources | `src/domain/standards.ts`, `docs/standards-sources.md` | 採用値とsource ID |
| Golden acceptance | `src/domain/golden-cases.ts`, `docs/golden-cases.md` | Case A〜JとFRL/Unknown boundary |
| Share/report | `src/domain/share.ts`, `report-export.ts` | `#preflight=v1.` とportable JSON |
| UI | `src/components/PreflightApp.tsx`, `src/i18n/ja.ts`, `src/styles/global.css` | chain input、result、proof、report |
| Page/build provenance | `src/pages/index.astro`, `src/release/provenance.ts` | static entrypointとexact build metadata |
| Browser acceptance | `e2e/preflight.spec.ts`, `playwright.config.ts` | desktop/mobile local/live suite |
| Deployment | `.github/workflows/deploy-pages.yml` | gated GitHub Pages artifact |

## Progress snapshot

- Public alpha contract: `[██████████] 100%` — release、deploy、live acceptanceまで完了。
- Proposed public beta foundation: `[███░░░░░░░] 30%` — engine/CI/report基盤はあるが、preset、adapter UI、PD UX、formal a11y/performance evidenceは未完了。
- Stable v1 trust program: `[██░░░░░░░░] 20%` — deterministic coreはあるが、evidence layer、schema evolution、実機校正、operations、stable support contractが未完了。

割合は工数消化率ではなく、各milestoneのexit evidenceがどこまで存在するかの監修用目安。

## Verified boundaries and unverified claims

Verified:

- 既知のDP/TMDS能力、DSC/HDR/VRR継続性、簡易PDを現行schemaの範囲で決定論的に評価する。
- TMDS不足を `FAIL`、精密payload未解決のHDMI FRLを `INDETERMINATE` に保つ。
- malformed/oversized/unknown-schema shareを拒否し、reportにbuild/schema/sourceを保持する。
- static buildと主要browser操作がlocal/liveで再現する。

Not verified / must not be implied:

- 実機link training、cable length/signal integrity、OS/driver/firmware、個別PDO/PPS/AVS、規格認証、特定型番互換性。
- HDMI FRLまたはHDMI 2.2のFEC/packet overhead込み精密映像payload。
- USB4/Thunderbolt tunneling、MST、複数display allocation。
- human screen-reader audit、代表実機matrix、false-positive/false-negative rate。
- GitHub Pagesの成功から、物理device acceptance、規格適合、商品推薦、商用/公開承認を推論すること。

## Residual work register

| Purpose | Effect | Requirements | State | Owner | Next move |
| --- | --- | --- | --- | --- | --- |
| 出典付きtiming preset | pixel clock誤入力を減らす | CTA/VESA一次資料または公式calculator、source ID、schema、tests | selected / not implemented | product + engineering | 3〜6件でM1.1を開始 |
| 方向付きadapter UI | DP→HDMI等を現実の方向で入力する | input/output transport、reverse FAIL、Unknown、share/report/E2E | engine concept exists / UI gap | engineering | presetと同じsliceでcard追加 |
| PD入力改善 | dock予約電力とEPR条件を誤解しにくくする | label/help、boundary fixtures、owner review | planned beta | product + engineering | M1.2でfield semantics監査 |
| Accessibility/performance | keyboard以外の利用品質を証明する | WCAG 2.2 AA checklist、screen reader/manual、contrast、Lighthouse budget | partial automation only | accessibility reviewer + engineering | M1中にaudit evidenceを保存 |
| HDMI FRL/2.2 payload | 高帯域HDMIを確定診断する | 公開可能な一次式、FEC/packet overhead、golden cases | safely unresolved | standards owner | 根拠入手まで定数追加禁止 |
| Evidence catalog | 型番/能力入力を根拠付きで補助する | evidence level、URL、checkedAt、expiry、human confirmation | candidate | product + data governance | M2前にschema spike |
| USB4/MST topology | dock/複数画面へ拡張する | graph/allocation model、performance budget、Unknown allocation | future major | architecture + product | M2後に一方だけ選ぶ |
| Device calibration | 誤判定を測定する | 代表機器、同意、driver/firmware、再現手順、匿名化 | unverified | product owner + tester | M4でmatrix設計 |
| Stable release operations | v1更新を安全に継続する | schema policy、support contract、source refresh、rollback、triage SLA | not started | maintainer/owner | M4後にrelease candidate |

## Immediate next slice acceptance

`docs/roadmap.md` のM1.1を実行する。特に次を監修する。

1. presetは「解像度/refreshから推定」ではなく、source IDへ追跡できるpixel clockを選ぶ。
2. adapterはconnector shapeではなく、明示されたinput/output transportと方向で評価する。
3. reverse directionは既知 `FAIL`、欠損能力はUnknownであり、どちらも最大能力へ補完しない。
4. UI追加が `src/domain/` をReact依存にしない。
5. hash/report schema互換性を壊す場合はversion migrationまたは安全な拒否を決定し、decision logへ残す。
6. docsだけでacceptせず、golden/unit/E2Eと公開後live evidenceで閉じる。

## Stop / escalate conditions

- 一次資料なしでexact payloadやpreset値を入れる必要が生じた。
- Unknownをfalseまたは最大値へ変える要求が出た。
- schema破壊をmigrationなしで公開share/reportへ反映する必要がある。
- 実機、規格適合、商品推薦、公開/商用承認を自動testから推論する必要がある。
- secret、外部account権限、法務判断、非公開規格本文の利用許諾が必要になった。

上記は実装で迂回せず、owner、必要証拠、影響、再開条件をcockpitへ記録する。

## Exact re-entry commands

```powershell
# Repository rootで実行する。
git status --short --branch
git fetch --prune --tags origin
git pull --ff-only origin main
git rev-list --left-right --count origin/main...HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm peers check
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
pnpm test:e2e
```

期待値はclean worktree、divergence `0 0`、Node 24、pnpm 11.9.0、35 unit tests、16 local E2E。公開artifactを再監査する時だけ `PLAYWRIGHT_BASE_URL` をlive URLへ設定して同じPlaywright suiteを実行する。

## Furthest next goal

監修上の最遠目標は「対応規格数最大」ではなく、方向・能力・証拠level・確認日・共有帯域を持つ構成graphを、Unknownを保った同一report schemaで説明し、購入相談・販売支援・IT導入設計へ安全に持ち出せるstable platformにすること。

商品catalog/Recommendation、広告、物理実機成立、規格認証、公開承認はdomain engineと別gateのまま維持する。詳細な段階順、turn幅、owner gateは `docs/roadmap.md` を参照する。
