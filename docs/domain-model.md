# Domain model

## 型の境界

`VideoRequest` は欲しい映像、`VideoTiming` はピクセルクロックの由来、`LinkMode` はリンクレート・レーン数・実効効率、`PortCapability` と `CableCapability` は各区間の能力、`SignalChain` は順序付きノードとエッジを表す。`PowerRequest` は映像から独立し、`PreflightReport` が両レポートを束ねる。

## 三値能力

機能能力は `supported | unsupported | unknown`。unknownをfalseや最大値へ変換しない。数値能力も未開示なら欠損値のままにし、判定に必要なら`UnknownRequirement`へ伝播する。

## 判定状態

- `EXACT_PASS`: 必須条件が既知で全て成立
- `CONDITIONAL_PASS`: 明示された未確認条件が成立すれば要求どおり成立
- `FAIL`: 既知の能力不足・非対応・逆方向により要求どおり不成立
- `INDETERMINATE`: 必須能力が欠け、成立可能性も十分に限定できない

警告は判定と独立する。near-limitは標準要件ではなく、利用可能ペイロードの5%未満を知らせる製品ポリシーである。

## チェーン評価

1. タイミングとクロマから未圧縮の必要ペイロードを整数Mbpsへ切り上げる。
2. 明示されたリンクモードだけから各ノード／エッジの利用可能ペイロードを求める。
3. 最小の既知能力をボトルネック候補とし、未知能力が要求判定に影響する場合はunknownへ残す。
4. DSCポリシーに応じて未圧縮と圧縮の両経路を評価する。
5. HDR/VRRは固定帯域倍率ではなく、全必須区間の機能継続性として評価する。
6. 元要求の判定を変更せず、別の`FallbackOption[]`として代替案を生成する。

## 変換器

adapterは`inputTransports`と`outputTransports`を持つ有向ノードである。チェーンの入出力が逆なら物理的にコネクターが合ってもFAILとする。

## 不明値伝播

DP Alt Mode、レーン数、リンクレート、DSC通過、HDR/VRR、PD出力など、判定に必要な欠損は、調査対象の区間、質問文、判定への影響とともに返す。不明能力を最大値として仮定しない。

## 証跡

`ProofStep`は順序、区間、コード、利用者向け説明、根拠となる入力を保持する。UI文言は日本語辞書でコードから変換し、エンジンはReactや表示文言に依存しない。
