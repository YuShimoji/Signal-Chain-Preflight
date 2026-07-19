# Known limitations — v0.1.0-alpha.1

## 判定対象外

- HDMI FRLのFEC・packet overheadを含む精密映像payload
- USB4 / Thunderboltトンネリング
- MST、複数ディスプレイ、帯域配分
- HDCP、eARC、個別HDR形式
- OS、driver、firmware、BIOSの制約
- ケーブル長、損失、温度、コネクター摩耗、信号品質
- 実商品型番の完全な能力catalog、規格適合、互換性保証
- USB PDの個別PDO / PPS / AVS交渉

## HDMI FRL境界

`HDMI_TMDS_18` は公開根拠に基づく既知payloadで評価し、不足なら `FAIL` とする。`HDMI_FRL_48_UNRESOLVED` はraw最大値しか採用せず、精密payloadが未解決なので `INDETERMINATE` とする。FRLをTMDSの自動fallbackや `EXACT_PASS` へ使わない。

別のDisplayPort経路を提案する場合も、必要なsource・cable・sink能力が確認前なので期待判定は `INDETERMINATE` であり、元のHDMI判定は変えない。

## Timing入力

- `PRESET`: 出典付き値を入れた場合の識別用。α版に大規模preset catalogはない。
- `CVT_RB2_ESTIMATE`: 入力支援用概算。規格準拠timing generatorではない。
- `CUSTOM_PIXEL_CLOCK`: blankingを含む実際のkHz値を利用者が入力する。

CUSTOMは1〜20,000,000 kHzのsoftware safety rangeで検証する。10,000 kHz未満または5,000,000 kHz超は、規格上の可否ではなく桁・単位確認の製品警告を出す。NaN、Infinity、負値、範囲外は診断しない。

## 証拠境界

自動テストは数式・分岐・UI操作・静的配信の再現性を示す。実機のlink trainingや表示成立、規格認証、購買後の互換性は示さない。公開Issueの実機観測は有用な校正材料だが、一次規格資料の代替にはしない。
