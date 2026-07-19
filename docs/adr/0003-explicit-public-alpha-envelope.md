# ADR 0003: Explicit public-alpha envelope and portable evidence

Date: 2026-07-19
Status: accepted

## Context

ローカルMVPを公開すると、`EXACT_PASS`が個別製品保証、raw HDMI FRL帯域が精密payload対応、URL共有が永続保存だと誤解される可能性がある。また誤判定報告には、どのbuild・入力・proofを見たかを再現できるartifactが必要である。

## Decision

- 対応／非対応範囲をUI、README、exportへ重複して明示する。
- TMDSの既知不足は`FAIL`、FRL精密payload未対応は`INDETERMINATE`とする。
- app version、report schema、commit、build date、environmentを画面とreportへ含める。
- reportはZod検証したstable-key JSONとし、共有URLとは分離する。
- 別transport fallbackは元判定を変えず、未確認なら期待判定も`INDETERMINATE`とする。

## Consequences

公開αは扱える方式が狭い一方、未検証領域を偽陽性へ変換しない。Issue報告をexact buildへ結び付けられる。reportには利用者入力の機器名が含まれるため、公開前のPII確認をUIとIssue formで要求する。
