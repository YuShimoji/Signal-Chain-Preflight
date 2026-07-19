# Golden cases

実行可能なauthorityは `src/domain/golden-cases.ts` と対応test。数値は `docs/standards-sources.md` の公開根拠または明示fixtureからのみ作る。

| ID | Purpose / fixture | Expected | Evidence anchor |
| --- | --- | --- | --- |
| GOLDEN-EXACT-HBR3 | 4K60 10b RGB / HBR3 x4 | EXACT_PASS / bandwidth sufficient | VESA HBR3 payload |
| GOLDEN-INTERMEDIATE-FAIL | dock only HBR2 x2 | FAIL / dock bottleneck | known 2-lane payload |
| GOLDEN-DSC-UNKNOWN | HBR2 x4 / dock DSC unknown | CONDITIONAL_PASS / DSC unknown proof | user target bpp |
| GOLDEN-ALT-MODE-UNKNOWN | USB-C / source Alt Mode unknown | INDETERMINATE / Alt Mode unknown | connector shape is not capability |
| GOLDEN-DP-TWO-LANE-FAIL | HBR3 x2 | FAIL / bandwidth proof | lane count explicit |
| GOLDEN-DP-FOUR-LANE-PASS | HBR3 x4 | EXACT_PASS | lane count explicit |
| GOLDEN-REVERSE-ADAPTER | DP → HDMI-to-DP → HDMI | FAIL / direction proof | directed adapter model |
| GOLDEN-HDR-UNSUPPORTED | dock HDR unsupported | FAIL / feature proof | feature continuity model |
| GOLDEN-HDMI-TMDS-OVER | 4K60 10b RGB / TMDS 18G | FAIL / TMDS bottleneck | HDMI LA + TI public material |
| GOLDEN-HDMI-FRL-UNSUPPORTED | FRL 48G unresolved | INDETERMINATE / usablePayload unknown | HDMI LA raw maximum only |
| GOLDEN-PD-REDUCED | 90W deliverable, 65W required, 100W preferred | video EXACT_PASS + power REDUCED_POWER | simplified USB-IF min-chain |
| SHARE-MALFORMED | invalid base64url | restore rejected | share schema |
| SHARE-OVERSIZED | more than 16,000 characters | restore rejected | product safety limit |
| SHARE-UNKNOWN-SCHEMA | valid envelope / schemaVersion 2 | restore rejected | explicit schema version |

各diagnostic caseはID、目的、fixture、期待verdict、bottleneckまたはunknown、必須proof code、source IDs、source assumptionをコード上に保持する。
