# Assumptions and validation backlog

## 今回置いた仮定

- 入力されたpixel clockは、blankingを含む実際のタイミング値として信頼する。
- ケーブルやgeneric pass-throughは、明示された最大リンクモード以下を通す。機能能力がunknownなら通過可能とは決めない。
- DSC target bppは利用者が機器仕様に合わせて入力し、画質や規格適合性をエンジンが保証しない。
- PD評価は各機器の公開最大値のmin-chainとドック予約電力で理論上限を求める。

## 仮定による制約

- 実機のリンクトレーニング、信号品質、ケーブル長、温度、ファームウェア、OS/ドライバーで結果が変わり得る。
- 映像payload以外の音声・補助データ余裕を完全再現しない。near-limit警告を安全余裕の目安として出す。
- CVT-RB2 estimateは規格準拠タイミング生成器ではなく、入力支援用の概算である。
- CUSTOM pixel clockの1〜20,000,000 kHzはsoftware safety rangeであり、10,000 kHz未満／5,000,000 kHz超の警告は規格値ではなく単位・桁確認の製品heuristicである。
- PDはPDO/PPS/AVS交渉を再現しない。

## 後で検証すべき事項

- VESA/CTAの利用可能な規格本文または公式計算器とのタイミング照合
- HDMI FRLの実効payloadの公開可能な一次資料
- 実製品データを正規化する入力仕様と、メーカー仕様の証拠レベル
- 実機マトリクスによる偽陽性／偽陰性の校正
