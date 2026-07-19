# Signal Chain Preflight

> その映像・給電経路は、買う前に成立するか。<br>
> 端子が刺さることと、信号が通ることは別問題です。

[公開αを使う](https://yushimoji.github.io/Signal-Chain-Preflight/)（`v0.1.0-alpha.1`）

PC・ゲーム機からドック、変換アダプター、ケーブル、ディスプレイまでの単一映像経路を、区間ごとの明示能力から決定論的に診断する静的Webアプリです。帯域、DSC・HDR・VRRの継続性、簡易USB Power Delivery、不明仕様、最小変更案、購買要件、判定証跡をブラウザ内だけで計算します。

## Public alpha support contract

対応する診断:

- DisplayPort HBR2 / HBR3 / UHBR10 / UHBR13.5 / UHBR20
- USB-C DisplayPort Alt Mode（2 / 4 lane、既知／unknown）
- HDMI TMDS 18 Gbps
- DSC、HDR、VRRの区間継続性
- 簡易USB Power Delivery

このα版では対応しない診断:

- HDMI FRLの精密映像payload
- USB4 / Thunderboltトンネリング
- MST / 複数画面
- HDCP / eARC
- OS / driver / firmware固有制約
- ケーブル長・信号品質・物理的完全性
- 製品型番単位の互換性・規格適合保証

HDMIでは、既知のTMDS能力が不足すれば `FAIL` です。FRLが必要でも、公開根拠だけで精密payloadを確定できない場合は `INDETERMINATE` を返します。DisplayPortなど別transportの確認案を示しても、元の判定を成立扱いへ変更しません。

詳細は [既知の制約](docs/known-limitations.md) を参照してください。

## 判定と共有

- `EXACT_PASS / CONDITIONAL_PASS / FAIL / INDETERMINATE` の四状態
- Unknownをfalseや最大能力に置換しない
- connector形状やversion labelから能力を推測しない
- bottleneck、条件、警告、unknown、proof、fallback、購買要件を表示
- `#preflight=v1.` のZod検証済みURL hashで状態を共有
- 不正・過大・未知schemaのhashは復元せず、安全に既定状態を表示

## 診断レポート

結果画面からJSONをコピーまたはダウンロードできます。レポートには `appVersion`、`buildCommit`、`buildDate`、`schemaVersion`、生成日時、映像要求、信号チェーン、判定、帯域、ボトルネック、条件、警告、unknown、proof、fallback、給電結果、source IDを含みます。

アプリが自動で個人情報を収集することはありませんが、レポートには利用者が入力した機器名が含まれます。公開Issueへ貼る前に個人情報を確認してください。ホームディレクトリ形式のローカルパスはexport時にマスクします。巨大JSONはURL queryに入れません。

## ローカル実行

Node.js 24とpnpm 11を使用します。

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

開発URLは `http://localhost:4321/Signal-Chain-Preflight/` です。

## 品質ゲート

```powershell
pnpm peers check
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` は直前に生成したproduction buildを `astro preview` で検証します。公開後は次のように同じsuiteを実URLへ向けられます。

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://yushimoji.github.io/Signal-Chain-Preflight/'
pnpm test:live
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

## 問題を報告する

[GitHub Issues](https://github.com/YuShimoji/Signal-Chain-Preflight/issues/new/choose) に次のフォームがあります。

- 判定結果が正しくない
- 能力・方式が不足している
- UI・アクセシビリティの問題
- 規格値・出典の訂正

誤判定の報告ではレポートJSON、実際／期待の判定、チェーン、一次資料、OS・driverなど判定外要因、再現手順を分けてください。

## 設計と根拠

- [現在地](docs/project-context.md)
- [商品定義](docs/product-brief.md)
- [判定モデル](docs/domain-model.md)
- [規格値と公開出典](docs/standards-sources.md)
- [仮定と保証外](docs/assumptions.md)
- [golden cases](docs/golden-cases.md)
- [release checklist](docs/release-checklist.md)
- [changelog](CHANGELOG.md)

## 公開方式

`main` へのpushで `.github/workflows/deploy-pages.yml` がtypecheck、lint、unit/coverage、static build、Chromium desktop/mobile production smokeを実行し、そのartifactだけをGitHub Pagesへ配備します。Pagesのdeploy jobだけに `pages: write` と `id-token: write` を与え、秘密情報はbuildへ注入しません。

本ツールは購入前の一次診断であり、実機相互接続、規格適合、個別製品の動作を保証しません。
