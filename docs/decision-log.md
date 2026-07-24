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
| 2026-07-19 | docs-only pushをPages workflowから除外する | exact tagのapp artifactをcloseout文書だけで再buildしない | docsが公開siteの入力になった時 |
| 2026-07-21 | 再開用handoffはdocs-onlyでmainへ同期する | 別端末がchat履歴なしでrelease状態、残作業、次手順を復元できるようにする | handoff内容が実装変更や公開artifactに影響し始めた時 |
| 2026-07-23 | public betaの最初の縦断sliceを「出典付きtiming preset + 方向付きadapter UI」に固定する | 現行engineの決定論と有向adapter契約を保ったまま、誤入力とUI上の最大gapを同時に減らせる。HDMI 2.2 / USB4 / MSTを混ぜると証拠・topology・allocationの論点が拡散する | preset一次資料が利用不能、またはadapter UIの前提となるdomain変更が必要と判明した時 |
| 2026-07-23 | HDMI 2.2、USB4 80Gbps、DP 2.1bはroadmap監視対象に留め、既存判定定数へ直ちに追加しない | 公式公開概要は将来範囲を示すが、区間payload、tunneling allocation、物理長の扱いを現行の線形link modeへ安全に写像する証拠とmodelが不足する | 公開可能な一次仕様、schema案、golden case、owner承認が揃った時 |
| 2026-07-25 | remote/code driftがないためM1.1のscopeとpnpm 11.9.0 pinを維持し、再検証結果だけをhandoffへ更新する | fetch/pull後も `3483cb2` で一致し全gateがgreen。依存更新通知や日付だけを理由に実装scope・規格定数・release artifactを動かす根拠はない | remote実装変更、peer不整合、security advisory、またはM1.1一次資料の採否が変わった時 |
