import { useEffect, useState } from 'react';
import { evaluatePreflight } from '../domain/evaluate';
import { baseInput, edge, node } from '../domain/fixtures';
import { buildDiagnosticReportExport, stringifyDiagnosticReport } from '../domain/report-export';
import { preflightInputSchema } from '../domain/schemas';
import { decodeShareHash, encodeShareHash } from '../domain/share';
import { LINK_MODES } from '../domain/standards';
import type { CapabilityState, ChainNode, LinkMode, PreflightInput, PreflightReport, Transport } from '../domain/types';
import { conditionText, fallbackText, powerLabels, proofText, unknownText, verdictLabels, verdictSentence, verdictShort, warningText } from '../i18n/ja';
import { BUILD_PROVENANCE, shortCommit } from '../release/provenance';

const modeEntries = Object.values(LINK_MODES);
const capabilityOptions: { value: CapabilityState; label: string }[] = [
  { value: 'supported', label: '対応' }, { value: 'unsupported', label: '非対応' }, { value: 'unknown', label: '分からない' },
];

function defaultMode(transport: Transport): LinkMode | null {
  if (transport === 'DISPLAYPORT') return LINK_MODES.DP_HBR3_4;
  if (transport === 'USB_C_DP_ALT_MODE') return LINK_MODES.USB_C_HBR3_2;
  if (transport === 'HDMI') return LINK_MODES.HDMI_TMDS_18;
  return null;
}

function rebuildEdges(input: PreflightInput, transport: Transport): void {
  const mode = defaultMode(transport);
  input.chain.edges = input.chain.nodes.slice(0, -1).map((item, index) => {
    const next = input.chain.nodes[index + 1];
    if (!next) throw new Error('CHAIN_NODE_MISSING');
    const created = edge({ id: `cable-${index + 1}`, from: item.id, to: next.id, transport, linkMode: mode });
    created.label = `区間 ${index + 1} ケーブル`;
    return created;
  });
}

export function PreflightApp() {
  const initial = baseInput();
  const [input, setInput] = useState<PreflightInput>(initial);
  const [report, setReport] = useState<PreflightReport>(() => evaluatePreflight(initial));
  const [reportInput, setReportInput] = useState<PreflightInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    const restored = decodeShareHash(window.location.hash);
    if (!restored) {
      if (window.location.hash.startsWith('#preflight=')) {
        const handle = window.setTimeout(() => setShareMessage('共有状態を復元できませんでした。入力を確認して診断してください。'), 0);
        return () => window.clearTimeout(handle);
      }
      return undefined;
    }
    const handle = window.setTimeout(() => {
      setInput(restored);
      setReport(evaluatePreflight(restored));
      setReportInput(restored);
      setShareMessage('共有状態を復元しました。');
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  const change = (mutate: (draft: PreflightInput) => void) => {
    const draft = structuredClone(input);
    mutate(draft);
    setInput(draft);
    setDirty(true);
    setShareMessage('');
    setValidationMessage('');
  };

  const runDiagnosis = () => {
    const parsed = preflightInputSchema.safeParse(input);
    if (!parsed.success) {
      setValidationMessage('入力値を診断できません。数値の範囲、空欄、pixel clockの単位を確認してください。');
      return;
    }
    setReport(evaluatePreflight(parsed.data));
    setReportInput(parsed.data);
    setDirty(false);
    setValidationMessage('');
    document.querySelector('#diagnosis-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const share = async () => {
    try {
      const parsed = preflightInputSchema.parse(input);
      const hash = encodeShareHash(parsed);
      window.history.replaceState(null, '', hash);
      setReport(evaluatePreflight(parsed));
      setReportInput(parsed);
      setDirty(false);
      setValidationMessage('');
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage('共有URLをコピーしました。');
      } catch {
        setShareMessage('URL hashへ保存しました。アドレスバーから共有できます。');
      }
    } catch {
      setShareMessage('共有URLを作成できませんでした。入力値または共有サイズを確認してください。');
    }
  };

  const selectedTransport = input.chain.edges[0]?.transport ?? 'DISPLAYPORT';
  const setTransport = (transport: Transport) => change((draft) => {
    const mode = defaultMode(transport);
    draft.chain.nodes.forEach((item, index) => {
      item.port.inputTransports = index === 0 ? [] : [transport];
      item.port.outputTransports = index === draft.chain.nodes.length - 1 ? [] : [transport];
      item.port.linkMode = mode;
      item.port.altModeSupport = transport === 'USB_C_DP_ALT_MODE' ? 'supported' : 'unknown';
    });
    rebuildEdges(draft, transport);
  });

  const updateNode = (id: string, mutate: (item: ChainNode) => void) => change((draft) => {
    const item = draft.chain.nodes.find((candidate) => candidate.id === id);
    if (item) mutate(item);
  });

  const addIntermediate = () => change((draft) => {
    if (draft.chain.nodes.length >= 4) return;
    const id = `intermediate-${draft.chain.nodes.length - 1}`;
    draft.chain.nodes.splice(-1, 0, node({
      id, label: `中間機器 ${draft.chain.nodes.length - 1}`, kind: 'dock', direction: 'BIDIRECTIONAL',
      inputTransports: [selectedTransport], outputTransports: [selectedTransport], linkMode: defaultMode(selectedTransport),
      altModeSupport: selectedTransport === 'USB_C_DP_ALT_MODE' ? 'supported' : 'unknown',
    }));
    rebuildEdges(draft, selectedTransport);
  });

  const removeIntermediate = (id: string) => change((draft) => {
    draft.chain.nodes = draft.chain.nodes.filter((item) => item.id !== id);
    rebuildEdges(draft, selectedTransport);
  });

  return (
    <main>
      <section className="workspace" aria-labelledby="builder-title">
        <div className="section-heading">
          <div><span className="eyebrow">01 / TARGET</span><h2 id="builder-title">映像ターゲット</h2></div>
          <p>pixel clockはblankingを含む値を入力してください。</p>
        </div>

        <div className="form-grid target-grid">
          <NumberField label="横幅" value={input.request.width} suffix="px" onChange={(value) => change((d) => { d.request.width = value; })} />
          <NumberField label="高さ" value={input.request.height} suffix="px" onChange={(value) => change((d) => { d.request.height = value; })} />
          <NumberField label="リフレッシュレート" value={input.request.refreshRateHz} suffix="Hz" onChange={(value) => change((d) => { d.request.refreshRateHz = value; })} />
          <NumberField label="Pixel clock" value={input.request.timing.pixelClockKHz} suffix="kHz" min={1} max={20_000_000} onChange={(value) => change((d) => { d.request.timing.pixelClockKHz = value; })} />
          <SelectField label="色深度" value={String(input.request.bitsPerChannel)} onChange={(value) => change((d) => { d.request.bitsPerChannel = Number(value) as 8 | 10 | 12; })} options={[['8', '8 bit'], ['10', '10 bit'], ['12', '12 bit']]} />
          <SelectField label="クロマ" value={input.request.chroma} onChange={(value) => change((d) => { d.request.chroma = value as PreflightInput['request']['chroma']; })} options={[['RGB', 'RGB / 4:4:4'], ['YCBCR_444', 'YCbCr 4:4:4'], ['YCBCR_422', 'YCbCr 4:2:2'], ['YCBCR_420', 'YCbCr 4:2:0']]} />
          <SelectField label="タイミング" value={input.request.timing.mode} onChange={(value) => change((d) => { d.request.timing.mode = value as PreflightInput['request']['timing']['mode']; })} options={[['CUSTOM_PIXEL_CLOCK', 'カスタムpixel clock'], ['PRESET', '出典付きプリセット値'], ['CVT_RB2_ESTIMATE', 'CVT-RB2概算値']]}/>
          <SelectField label="DSC" value={input.request.dscPolicy} onChange={(value) => change((d) => { d.request.dscPolicy = value as PreflightInput['request']['dscPolicy']; })} options={[['DISABLED', '使用しない'], ['ALLOWED', '必要なら許可'], ['REQUIRED', '必須']]} />
          <NumberField label="DSC target bpp" value={input.request.dscTargetBitsPerPixel ?? 8} suffix="bpp" step={0.25} onChange={(value) => change((d) => { d.request.dscTargetBitsPerPixel = value; })} />
        </div>
        <div className="toggle-row">
          <label className="check"><input type="checkbox" checked={input.request.hdrRequired} onChange={(event) => change((d) => { d.request.hdrRequired = event.target.checked; })} /> HDR必須</label>
          <label className="check"><input type="checkbox" checked={input.request.vrrRequired} onChange={(event) => change((d) => { d.request.vrrRequired = event.target.checked; })} /> VRR必須</label>
        </div>
        {input.request.vrrRequired && <div className="form-grid vrr-grid">
          <NumberField label="VRR最小" value={input.request.vrrMinHz ?? 40} suffix="Hz" onChange={(value) => change((d) => { d.request.vrrMinHz = value; })} />
          <NumberField label="VRR最大" value={input.request.vrrMaxHz ?? input.request.refreshRateHz} suffix="Hz" onChange={(value) => change((d) => { d.request.vrrMaxHz = value; })} />
        </div>}

        {input.powerRequest && <details className="power-inputs">
          <summary>USB Power Deliveryも評価する</summary>
          <p>個別PDO交渉ではなく、充電器・ケーブル・ドックの最小制約から理論上限を求めます。</p>
          <div className="form-grid power-grid">
            <NumberField label="充電器の最大電力" value={input.powerRequest.chargerMaxPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.chargerMaxPowerW = value; })} />
            <NumberField label="充電器の最大電圧" value={input.powerRequest.chargerMaxVoltageV ?? 0} suffix="V" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.chargerMaxVoltageV = value; })} />
            <NumberField label="ケーブルの最大電力" value={input.powerRequest.cableMaxPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.cableMaxPowerW = value; })} />
            <CapabilitySelect label="ケーブルEPR" value={input.powerRequest.cableEprSupport} onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.cableEprSupport = value; })} />
            <NumberField label="ドック入力上限" value={input.powerRequest.dockInputMaxPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.dockInputMaxPowerW = value; })} />
            <NumberField label="ドック内部消費" value={input.powerRequest.dockReservePowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.dockReservePowerW = value; })} />
            <NumberField label="ドックのホスト出力上限" value={input.powerRequest.dockHostOutputMaxPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.dockHostOutputMaxPowerW = value; })} />
            <NumberField label="ホスト必要電力" value={input.powerRequest.hostRequiredPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.hostRequiredPowerW = value; })} />
            <NumberField label="ホスト希望電力" value={input.powerRequest.hostPreferredPowerW ?? 0} suffix="W" onChange={(value) => change((d) => { if (d.powerRequest) d.powerRequest.hostPreferredPowerW = value; })} />
          </div>
        </details>}
      </section>

      <section className="workspace" aria-labelledby="chain-title">
        <div className="section-heading">
          <div><span className="eyebrow">02 / CHAIN</span><h2 id="chain-title">信号チェーン</h2></div>
          <SelectField label="経路トランスポート" value={selectedTransport} onChange={(value) => setTransport(value as Transport)} options={[['DISPLAYPORT', 'DisplayPort'], ['USB_C_DP_ALT_MODE', 'USB-C DP Alt Mode'], ['HDMI', 'HDMI']]} />
        </div>

        <div className="chain" aria-label="ソースからシンクまでの信号経路">
          {input.chain.nodes.map((item, index) => (
            <div className="chain-segment" key={item.id}>
              <NodeCard item={item} transport={selectedTransport} canRemove={item.kind !== 'source' && item.kind !== 'sink'} onRemove={() => removeIntermediate(item.id)} onChange={(mutate) => updateNode(item.id, mutate)} />
              {index < input.chain.edges.length && <EdgeCard edgeIndex={index} input={input} transport={selectedTransport} onChange={change} />}
            </div>
          ))}
        </div>
        <button className="secondary-button" type="button" disabled={input.chain.nodes.length >= 4} onClick={addIntermediate}>＋ 中間機器を追加（最大2台）</button>
      </section>

      <section className="action-bar" aria-label="診断操作">
        <div><strong>{dirty ? '入力が変更されています' : '現在の入力を診断済み'}</strong><span>外部APIへ送信しません</span></div>
        <button className="primary-button" type="button" onClick={runDiagnosis}>この経路を診断</button>
        <button className="share-button" type="button" onClick={share}>共有URLを作成</button>
        <span className="share-message" aria-live="polite">{shareMessage}</span>
      </section>
      {validationMessage && <p className="validation-message" role="alert">{validationMessage}</p>}

      <ReportView report={report} reportInput={reportInput} stale={dirty} />
    </main>
  );
}

function NumberField({ label, value, suffix, step = 1, min = 0, max, onChange }: { label: string; value: number; suffix: string; step?: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label className="field"><span>{label}</span><span className="input-with-suffix"><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><em>{suffix}</em></span></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>;
}

function CapabilitySelect({ label, value, onChange }: { label: string; value: CapabilityState; onChange: (value: CapabilityState) => void }) {
  return <SelectField label={label} value={value} onChange={(next) => onChange(next as CapabilityState)} options={capabilityOptions.map((item) => [item.value, item.label])} />;
}

function NodeCard({ item, transport, canRemove, onRemove, onChange }: { item: ChainNode; transport: Transport; canRemove: boolean; onRemove: () => void; onChange: (mutate: (item: ChainNode) => void) => void }) {
  const allowedModes = modeEntries.filter((mode) => mode.transport === transport);
  return <article className="node-card">
    <header><span className="node-kind">{item.kind}</span>{canRemove && <button type="button" className="remove-button" onClick={onRemove} aria-label={`${item.label}を削除`}>削除</button>}</header>
    <label className="field"><span>機器名</span><input value={item.label} onChange={(event) => onChange((nodeItem) => { nodeItem.label = event.target.value; })} /></label>
    {canRemove && <SelectField label="機器種別" value={item.kind} onChange={(value) => onChange((nodeItem) => { nodeItem.kind = value as ChainNode['kind']; })} options={[['dock', 'ドック'], ['adapter', '変換アダプター'], ['genericPassThrough', '中継機器']]} />}
    <SelectField label="最大リンク能力" value={item.port.linkMode?.id ?? 'unknown'} onChange={(value) => onChange((nodeItem) => { nodeItem.port.linkMode = value === 'unknown' ? null : (modeEntries.find((mode) => mode.id === value) ?? null); })} options={[['unknown', '分からない'], ...allowedModes.map((mode): [string, string] => [mode.id, mode.label])]} />
    {transport === 'USB_C_DP_ALT_MODE' && <CapabilitySelect label="DP Alt Mode" value={item.port.altModeSupport} onChange={(value) => onChange((nodeItem) => { nodeItem.port.altModeSupport = value; })} />}
    <div className="capability-grid">
      {(['dscSupport', 'hdrSupport', 'vrrSupport'] as const).map((feature) => <CapabilitySelect key={feature} label={feature.replace('Support', '').toUpperCase()} value={item.port.features[feature]} onChange={(value) => onChange((nodeItem) => { nodeItem.port.features[feature] = value; })} />)}
    </div>
  </article>;
}

function EdgeCard({ edgeIndex, input, transport, onChange }: { edgeIndex: number; input: PreflightInput; transport: Transport; onChange: (mutate: (draft: PreflightInput) => void) => void }) {
  const item = input.chain.edges[edgeIndex];
  if (!item) return null;
  const allowedModes = modeEntries.filter((mode) => mode.transport === transport);
  return <div className="edge-card" aria-label={item.label}>
    <span className="edge-line" aria-hidden="true">→</span>
    <SelectField label={`区間 ${edgeIndex + 1} ケーブル能力`} value={item.capability.linkMode?.id ?? 'unknown'} onChange={(value) => onChange((draft) => {
      const target = draft.chain.edges[edgeIndex];
      if (target) target.capability.linkMode = value === 'unknown' ? null : (modeEntries.find((mode) => mode.id === value) ?? null);
    })} options={[['unknown', '分からない'], ...allowedModes.map((mode): [string, string] => [mode.id, mode.label])]} />
  </div>;
}

function ReportView({ report, reportInput, stale }: { report: PreflightReport; reportInput: PreflightInput; stale: boolean }) {
  const [exportMessage, setExportMessage] = useState('');
  const metric = (value: number | null, suffix: string) => value === null ? '不明' : `${value.toLocaleString()} ${suffix}`;
  const createJson = () => stringifyDiagnosticReport(buildDiagnosticReportExport(reportInput, report, BUILD_PROVENANCE));
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(createJson());
      setExportMessage('診断レポートJSONをコピーしました。個人情報がないか確認してから共有してください。');
    } catch {
      setExportMessage('レポートをコピーできませんでした。JSONダウンロードを利用してください。');
    }
  };
  const downloadReport = () => {
    try {
      const url = URL.createObjectURL(new Blob([createJson()], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'signal-chain-preflight-report.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage('診断レポートJSONをダウンロードしました。');
    } catch {
      setExportMessage('レポートを生成できませんでした。入力を再診断してください。');
    }
  };
  return <section id="diagnosis-result" className={`result-panel verdict-${report.verdict.toLowerCase()}`} aria-labelledby="result-title">
    {stale && <div className="stale-banner" role="status">この結果は変更前の入力です。「この経路を診断」で更新してください。</div>}
    <div className="result-hero">
      <div><span className="eyebrow">03 / RESULT</span><span className="verdict-badge">{verdictShort[report.verdict]}</span><h2 id="result-title">{verdictLabels[report.verdict]}</h2><p>{verdictSentence(report)}</p></div>
      <div className="signal-mark" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>

    {report.bottleneck && <section className="bottleneck-card"><span>最初のボトルネック</span><strong>{report.bottleneck.componentLabel}</strong><p>{report.bottleneck.availablePayloadMbps.toLocaleString()} Mbps・{report.bottleneck.reasonCode === 'FIRST_INSUFFICIENT_CAPABILITY' ? '必要帯域に不足' : '経路内で最小の既知能力'}</p></section>}
    <div className="metrics">
      <Metric label="タイミングモード" value={report.requestedMode.timing.mode} />
      <Metric label="Pixel clock" value={metric(report.requestedMode.timing.pixelClockKHz, 'kHz')} />
      <Metric label="必要ペイロード" value={metric(report.requiredPayloadMbps, 'Mbps')} />
      <Metric label="利用可能ペイロード" value={metric(report.availablePayloadMbps, 'Mbps')} />
      <Metric label="ヘッドルーム" value={metric(report.headroomMbps, 'Mbps')} />
      <Metric label="安全余裕の目安" value={report.headroomPercent === null ? '不明' : `${report.headroomPercent}%`} />
    </div>

    <section className="report-tools" aria-labelledby="report-tools-title">
      <div><span className="eyebrow">PORTABLE REPORT</span><h3 id="report-tools-title">再現可能な診断レポート</h3><p>v{BUILD_PROVENANCE.appVersion}・schema 1・commit {shortCommit(BUILD_PROVENANCE.buildCommit)}。ユーザー入力の機器名を含むため、共有前に個人情報を確認してください。</p></div>
      <div className="report-actions"><button type="button" className="share-button" onClick={copyReport}>レポートJSONをコピー</button><button type="button" className="secondary-button" onClick={downloadReport}>JSONをダウンロード</button></div>
      <p className="export-message" role="status" aria-live="polite">{exportMessage}</p>
    </section>

    {(report.conditions.length > 0 || report.unknowns.length > 0 || report.warnings.length > 0) && <div className="result-grid">
      <ResultList title="条件・不明情報" tone="caution" items={[
        ...report.conditions.map((item) => conditionText(item.code)),
        ...report.unknowns.map((item) => `${item.componentLabel}: ${unknownText(item)}`),
      ]} empty="確認条件はありません" />
      <ResultList title="警告" tone="warning" items={report.warnings.map(warningText)} empty="警告はありません" />
    </div>}

    {report.fallbacks.length > 0 && <section className="detail-section"><h3>最小変更案</h3><div className="fallback-grid">{report.fallbacks.map((item) => {
      const text = fallbackText(item.id);
      return <article key={item.id}><span>{verdictLabels[item.expectedVerdict]}</span><h4>{text.title}</h4><p>{text.rationale}</p><small>{text.tradeoff}</small></article>;
    })}</div></section>}

    <section className="detail-section"><h3>判定根拠のステップ別証跡</h3><ol className="proof-list">{report.proofSteps.map((step) => <li key={step.index}><span>{String(step.index).padStart(2, '0')}</span><p>{proofText(step)}</p></li>)}</ol></section>

    <section className="detail-section"><h3>購買要件</h3>{report.purchaseRequirements.length > 0 ? <div className="purchase-grid">{report.purchaseRequirements.map((item, index) => <article key={`${item.targetComponentId}-${index}`}><span>{item.category}</span><h4>{item.targetComponentId}</h4><strong>必須</strong><ul>{item.mustHave.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul><strong>避ける表示</strong><ul>{item.avoid.map((avoid) => <li key={avoid}>{avoid}</li>)}</ul></article>)}</div> : <p className="muted">現在の既知経路に交換必須の要件はありません。</p>}</section>

    {report.powerReport && <section className="detail-section power-card"><div><span className="eyebrow">POWER DELIVERY</span><h3>{powerLabels[report.powerReport.verdict]}</h3><p>理論上のホスト供給上限: <strong>{report.powerReport.theoreticalDeliverablePowerW === null ? '不明' : `${report.powerReport.theoreticalDeliverablePowerW} W`}</strong></p></div><ul>{report.powerReport.warnings.map((item) => <li key={item}>{warningText(item)}</li>)}</ul></section>}

    <section className="detail-section"><h3>規格ソース</h3><div className="source-list">{report.sourceReferences.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.organization}</span><strong>{source.title}</strong><small>確認日 {source.checkedAt} ↗</small></a>)}</div></section>

    <aside className="recommendation-slot"><span>RECOMMENDATION SLOT</span><strong>商品候補は診断エンジンから分離しています</strong><p>将来、上の購買要件を満たす候補だけを、広告関係と適合根拠を明示して表示します。</p></aside>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function ResultList({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: string }) {
  return <section className={`result-list ${tone}`}><h3>{title}</h3>{items.length > 0 ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>{empty}</p>}</section>;
}
