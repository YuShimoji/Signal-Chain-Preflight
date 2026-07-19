# ADR 0001: Model capabilities, not version labels

Status: accepted — 2026-07-18

## Context

同じ「HDMI 2.1」「DisplayPort 2.1」「USB-C」表記でも、リンクレート、レーン数、Alt Mode、DSC、VRR、PD能力は製品ごとに異なる。バージョン名から最大能力を導くと、購入判断で危険な偽陽性になる。

## Decision

リンクレート、レーン数、符号化効率、方向、機能対応、給電能力を独立した能力として保持する。仕様バージョン名は出典メタデータには置けるが、診断入力には使用しない。不明能力はunknownとして判定へ伝播する。

## Consequences

入力項目は増えるが、根拠を区間別に説明できる。商品データ取り込み時も、宣伝ラベルではなく個々の開示能力を正規化する必要がある。
