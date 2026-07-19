# Standards sources

確認日: 2026-07-18

## 採用した規格値

| 定数 | 採用値 | 公開根拠 | 実装上の扱い |
| --- | ---: | --- | --- |
| DP HBR2 | 5.4 Gbps/lane, 8b/10b | VESA公開資料とHBR3比較 | 2/4レーンの実効値を整数計算 |
| DP HBR3 | 8.1 Gbps/lane, 8b/10b | VESA DP 1.3/2.0公開資料。4 lane raw 32.4、payload 25.92 Gbps | 検証済み |
| DP UHBR10/13.5/20 | 10/13.5/20 Gbps/lane, 128b/132b系。UHBR20 x4の公開最大payload 77.37 Gbps | VESA DP 2.0 / UHBR認証資料 | 公開payload比を用いる。規格適合保証ではない |
| HDMI TMDS 18G | raw 18 Gbps、TMDS 8b/10b | HDMI LAの18 Gbps公開情報、TIのTMDS符号化説明 | 実効14.4 Gbpsとして扱う |
| HDMI FRL 48G | raw最大48 Gbps | HDMI LAのHDMI 2.1b公開情報、AMDのFRLレート／16b18b説明 | FEC等を含む厳密映像payloadが公開根拠だけでは確定しないためunresolved |
| USB PD EPR | 28/36/48 Vで140/180/240 W、最大240 W | USB-IF USB Charger (USB PD) | 100 W超でEPR対応と最大電圧を条件評価 |

## Source register

- VESA, “DisplayPort 2.0 Video Standard”, https://vesa.org/press/vesa-publishes-displayport-2-0-video-standard-enabling-support-for-beyond-8k-resolutions-higher-refresh-rates-for-4k-hdr-and-virtual-reality-applications/, public, checked 2026-07-18.
- VESA, “DisplayPort UHBR Device and Cable Certification”, https://vesa.org/featured-articles/vesa-readies-displayport-uhbr-ultra-high-bit-rate-device-certification-and-begins-certification-of-uhbr-cables/, public, checked 2026-07-18.
- VESA, “Why DisplayPort”, https://vesa.org/displayport-developer/why-displayport/, public, checked 2026-07-18.
- HDMI Licensing Administrator, “HDMI 2.1b Specification overview”, https://www.hdmi.org/spec/hdmi2_1/index.aspx, public overview, checked 2026-07-18.
- HDMI Licensing Administrator, “What Does It Mean When Gear is Marketed as HDMI 2.1 Product?”, https://www.hdmi.org/blog/detail/139, public, checked 2026-07-18.
- Texas Instruments, “FPD-Link IO Interfaces: HDMI”, https://www.ti.com/video/5503353893001, public vendor technical material, checked 2026-07-18.
- AMD, “HDMI 2.1 Transmitter Subsystem”, https://docs.amd.com/r/en-US/pg350-v-hdmi-txss1/HDMI-2.1-Transmitter, public vendor implementation guide, checked 2026-07-18.
- USB-IF, “Cables and Connectors”, https://www.usb.org/cable_connector, public, checked 2026-07-18.
- USB-IF, “USB Charger (USB Power Delivery)”, https://www.usb.org/usb-charger-pd, public, checked 2026-07-18.
- CTA, “CTA-861 OVT Calculator”, https://www.cta.tech/cta-861-ovt-calculator/, public calculator, checked 2026-07-18.

## 未解決事項

- HDMI FRL 3/6/8/10/12 Gbps lane構成のうち、FEC・パケット化を含む映像payloadを公式公開情報だけで厳密に算出する式。
- HDMI 2.2の64/80/96 Gbps系のリンク構成と実効payload。初版では選択肢・判定定数に入れない。
- CTA-861の全タイミング表とVESA CVT-RB2の規格本文は公開概要だけでは完全再現できない。初版の自動推定は製品上の「概算」とし、厳密診断にはカスタムpixel clockを使う。
- DP UHBRの公開77.37 Gbpsは最大payloadの概要値。個別FEC/transport overheadの規格本文レベル再現は将来の検証対象。
