# Idea ledger

| Idea | Value | State | Constraint / next evidence |
| --- | --- | --- | --- |
| メーカー仕様URLから能力候補を抽出 | 入力負荷を下げる | parked | 診断と外部取得を分離し、引用・確認フローが必要 |
| 実商品RecommendationSlot | 収益化と購入支援 | parked | 診断エンジンから分離し、要件適合と広告開示が必要 |
| 複数画面/MSTグラフ | ドック診断の実用範囲拡大 | future | 単一ストリームの正確性とUX検証後 |
| 匿名ローカル比較保存 | 複数構成を比べやすい | candidate | PIIなし、明示保存、削除可能であること |
| 出典付き代表タイミング集 | pixel clockの誤入力を減らす | active-next-slice | CTA/VESA一次資料または公式calculatorとの数値照合、source ID、schema、unit testが必要 |
| 方向付きadapter card | 異種transport変換を実際のUIから診断できる | active-next-slice | 入出力transportを別に編集し、逆方向FAIL、Unknown伝播、share/report roundtrip、E2Eを保持 |
| 証拠level付き能力catalog | 型番・仕様の入力負荷を下げつつ推測を避ける | candidate-after-beta | 診断engineから外部取得を分離し、source URL、確認日、引用範囲、利用者確認、失効を持つ |
| USB4 tunneling / MST allocation graph | dock・複数画面の主要相談を扱う | future-major-slice | 線形min-chainでは表現不能。帯域共有、有向tunnel、複数sink、Unknown allocationの新domain modelが必要 |
| 診断reportのJSON export | 購入相談や問い合わせへ持ち出せる | completed-alpha | schema version、build provenance、出典、保証外を保持。印刷は将来候補 |

Review 2026-07-25: 7月23日handoff以降にremote実装変更はなく、active-next-sliceと将来ideaの状態は据え置く。次の新規判断はtiming authorityの一次資料採否またはM1.1 schema設計で記録する。
