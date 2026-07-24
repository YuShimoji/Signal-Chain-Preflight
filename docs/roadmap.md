# Delivery roadmap and far-goal proposal

更新: 2026-07-25

Checkpoint: 7月23日handoff以降にremote実装変更はなく、7月25日のfull local/live再検証もgreen。milestoneの完了率とturn幅は据え置き、M1.1の最初の実行順を一次資料→domain contract→UI→roundtrip→release evidenceとして明確化する。

## Estimation contract

1 turnは、Codexが一つのまとまった縦断作業を実装し、test、文書同期、報告まで完了する長めの自律ブロック。turn数は人日ではない。規格本文の入手、standards/product ownerの採否、代表実機、法務、公開判断、外部サービス設定は別のowner gateであり、turnを消費しても解消しない場合がある。

最短の機能量ではなく、Unknownを潰さない証拠品質、schema migration、実URL、実機校正、運用までをexit evidenceに含める。見積もりは新しい一次根拠や実機結果で更新する。

## Goal ladder

| Milestone | State | Codex work estimate | Exit evidence |
| --- | --- | ---: | --- |
| M0 — `v0.1.0-alpha.1` public alpha | completed | completed | 純粋engine、Case A〜J、UI、share/report、GitHub Pages、tag/prerelease、local/live E2E |
| M1 — v0.2 public beta foundation | active-next | +3〜5 turns | 出典付きtiming preset、方向付きadapter UI、PD入力改善、WCAG 2.2 AA中心のmanual/automated audit、performance/SEO再監査、公開case |
| M2 — v0.3 evidence and scenario layer | planned | M1後 +4〜7 turns | source ID・確認日・evidence level・失効を持つ能力catalog境界、代表構成library、比較保存/export、report/share schema migration、出典監査 |
| M3 — v0.4 topology expansion | future-major | M2後 +6〜10 turns | USB4 tunnelingまたはMST/複数sinkのどちらか一方を新graph/allocation modelで実装。共有帯域、方向、Unknown allocation、golden cases、性能上限を証明 |
| M4 — v0.5 calibration and operations | owner-gated | M3後 +4〜8 turns + device work | 同意済み匿名観測、代表実機matrix、偽陽性/偽陰性分類、再現report、triage SLA、source refresh運用、privacy review |
| M5 — v1.0 trust release | proposed | M4後 +3〜6 turns | support contract凍結、schema互換方針、WCAG 2.2 AA監査、threat/privacy review、release/rollback runbook、実機境界を明記したstable release |
| M6 — post-v1 competitive platform | optional | v1後 +8〜16 turns | 型番catalog/Recommendationをengineから分離、広告開示、API/埋め込み、英語化、編集case、vendor/community correction governance |

現在からstable v1までは **20〜36 turns + owner gates**、post-v1 platformまで含めると **28〜52 turns + owner gates** を粗い計画幅とする。旧roadmapの「競合水準13〜21 turns」はalpha直後の機能量中心の見積もりであり、この更新では証拠layer、graph migration、実機校正、運用を明示したため幅が広がった。

## Immediate next slice — M1.1

目的は「代表的な要求を少ない誤入力で作り、方向付き変換を含む一つのチェーンを、既存の四状態契約のまま共有・報告できる」こと。

含める:

- 3〜6件程度の一次資料または公式calculator照合済みtiming preset
- presetごとのsource ID、表示名、pixel clock、timing由来、確認日
- adapterのinput transport / output transportを別々に編集できるcard
- 逆方向adapterを既知 `FAIL`、能力欠損をUnknownとして伝播
- share hash、portable report、golden case、unit、desktop/mobile E2Eのroundtrip
- UI文言、known limitations、standards source、decision logの同期

含めない:

- HDMI FRL/HDMI 2.2の精密payload
- USB4/Thunderbolt tunneling、MST、複数画面
- 型番catalog、価格、在庫、Recommendation
- 実機成立の保証

M1.1のexit gate:

1. preset値がsource registerとtest fixtureから追跡できる。
2. connector形状またはversion labelだけから能力を補完しない。
3. adapter方向を反転したgolden caseが `FAIL` になる。
4. Unknownを含むadapter chainが `EXACT_PASS` にならない。
5. share/reportを復元しても方向・source・Unknownが失われない。
6. frozen install、peer、typecheck、lint、coverage、build、local E2E、必要時live E2Eがgreen。

M1.1 execution order:

1. CTA/VESAの公開一次資料または公式calculatorから、許諾・再現入力・確認日を含む3〜6件のpreset候補を作る。根拠不十分な候補は採用せずidea/source recordへ戻す。
2. `VideoTiming`とsource registerの最小contractを決め、既存 `#preflight=v1.` / portable reportの互換性判断を先に行う。
3. pure domain registryとgolden/unit testsを追加し、その後にpreset selectorと方向別adapter input/output UIを接続する。
4. reverse adapter `FAIL`、missing capability Unknown、share/report roundtrip、desktop/mobile E2Eを閉じる。
5. ownerがsource採否と公開範囲を確認した後だけbeta artifactをbuild/deployし、local成功とlive成功を別々に記録する。

## Decision gates before later milestones

| Gate | Question | Required evidence | Owner |
| --- | --- | --- | --- |
| Timing authority | どの公式表/calculatorをpreset値の正とするか | 再現可能な入力、source URL、確認日、許諾範囲 | standards + product |
| HDMI expansion | FRL/HDMI 2.2を精密判定できるか | FEC/packet overhead込みの公開可能な一次式とgolden cases | standards owner |
| Topology choice | USB4 tunnelingとMSTのどちらを先に扱うか | user case頻度、domain spike、allocation complexity、性能予算 | product + engineering |
| Device calibration | 何を成立/不成立の観測証拠とするか | device matrix、手順、driver/firmware、匿名化、再現report | product owner + tester |
| Commercial layer | 商品候補を表示してよいか | engine分離、適合根拠、広告開示、更新責任、法務判断 | owner/legal/business |

## Furthest safe north star

長期的には、端子名や規格versionではなく、各区間の方向・能力・証拠level・確認日・共有帯域を入力として、単一画面から複数sinkを含む構成まで説明可能に診断し、判定を同じschemaのreportとして購入相談・販売支援・IT導入設計へ持ち出せる基盤を目指す。

ただし、計算上の成立、実機観測、規格適合、商品推薦、広告、公開承認は別gateのまま保つ。競争力の中心は対応規格数だけではなく、「不明を不明のまま説明し、どの証拠を追加すれば判定が進むか」を再現可能に示すことに置く。
