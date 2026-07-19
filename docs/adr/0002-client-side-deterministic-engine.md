# ADR 0002: Client-side deterministic engine

Status: accepted — 2026-07-18

## Context

初期診断は規格定数と利用者入力だけで完結し、個人情報や最新在庫を必要としない。外部APIは再現性、プライバシー、可用性、静的ホスティングを悪化させる。

## Decision

診断エンジンをUI非依存の純粋TypeScript関数として実装し、ブラウザ内で実行する。共有状態はZodで検証したバージョン付きJSONをURL hashへ保存する。ランタイムバックエンドと診断時APIを持たない。

## Consequences

同じ入力は同じ結果を返し、静的ホスティングできる。規格データ更新にはアプリの再ビルドが必要で、URLへ保存するデータ量には上限を設ける。
