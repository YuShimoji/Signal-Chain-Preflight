# Changelog

このプロジェクトの利用者向け変更を記録します。

## [0.1.0-alpha.1] - 2026-07-19

### Added

- 単一映像チェーンの四状態診断と説明可能なproof
- DisplayPort HBR2/HBR3/UHBR、USB-C DP Alt Mode、HDMI TMDS、簡易USB PD
- DSC/HDR/VRR継続性、Unknown伝播、fallback、購買要件
- version付きURL hash共有と不正／過大／未知schema拒否
- Zod検証済み診断レポートのコピー／JSON download
- app version、report schema、commit SHA、build日時のprovenance表示
- 公開αの対応範囲、既知制約、4種類のIssue form
- GitHub Pages validation/deploy workflowとproduction browser smoke

### Known limitations

- HDMI FRLの精密payloadは未対応で、FRL選択時は `INDETERMINATE`
- USB4/Thunderbolt、MST、複数画面、HDCP/eARC、OS/driver、物理信号品質は未対応
- PRESET値の大規模収録は行わず、CVT-RB2は概算、CUSTOMは利用者入力

[0.1.0-alpha.1]: https://github.com/YuShimoji/Signal-Chain-Preflight/releases/tag/v0.1.0-alpha.1
