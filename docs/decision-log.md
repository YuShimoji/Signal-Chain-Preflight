# Decision log

| Date | Decision | Reason | Revisit trigger |
| --- | --- | --- | --- |
| 2026-07-18 | Astro + React island + TypeScript + Vitest + Playwright + Zod | 添付仕様の空リポジトリ既定。静的配信と純粋エンジンを両立 | ホスティング要件がSSRを必要とする時 |
| 2026-07-18 | 初版は単一線形チェーン | ユーザー価値を証明でき、将来のグラフ型を妨げない最小縦断 | MST/複数画面を扱う時 |
| 2026-07-18 | HDMI FRL精密payloadをunresolvedに隔離 | 公開一次情報で生帯域は確認できるが全オーバーヘッドを確定できない | 公開可能な規格根拠を取得した時 |
| 2026-07-18 | near-limitを5%の製品ポリシーにする | 標準適合ではなく安全余裕の目安として明示できる | 実機データで校正できた時 |
| 2026-07-18 | URL共有は`#preflight=v1.`の検証済みJSONにする | backendとPIIを持たず、古いschemaを安全に拒否できる | stateが16KBを超える時 |
| 2026-07-18 | TypeScript 6.0.3 / ESLint 9.39.5へ固定 | 最新majorはAstro check / typescript-eslint / jsx-a11yのpeer範囲を先行していた | 依存側が新majorを正式対応した時 |
| 2026-07-18 | GitHub Pages用の検証・deploy workflowを用意する | static buildの公開経路をコード化し、mainの品質ゲートを必須化する | custom domainまたは別hostを選ぶ時 |
| 2026-07-19 | v0.1.0-alpha.1の対応範囲をUI・README・reportに固定する | 公開後にFRL未対応や実機保証をEXACT_PASSと誤解させない | FRL精密payloadを一次根拠付きで実装した時 |
| 2026-07-19 | portable reportへversion/schema/commit/buildを含める | Issueの観測をexact buildと入力・proofへ結び付ける | report schemaをversion upする時 |
| 2026-07-19 | CUSTOM timingへsoftware safety rangeと桁警告を置く | NaN/Infinity/負値を拒否し、単位誤りを判定前に見つける | 公式timing generatorを実装した時 |
