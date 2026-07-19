import { baseInput, edge, node } from './fixtures';
import { LINK_MODES } from './standards';
import type { LinkMode, PreflightInput, Verdict } from './types';

export type DiagnosticGoldenCase = {
  id: string;
  purpose: string;
  fixture: string;
  expected: {
    verdict: Verdict;
    bottleneckComponentId?: string;
    unknownField?: string;
    proofCode: string;
    sourceIds: string[];
  };
  sourceAssumptions: string;
  createInput: () => PreflightInput;
};

function setAllModes(input: PreflightInput, mode: LinkMode): PreflightInput {
  input.chain.nodes.forEach((item) => { item.port.linkMode = mode; });
  input.chain.edges.forEach((item) => {
    item.capability.linkMode = mode;
    item.capability.transports = [mode.transport];
    item.transport = mode.transport;
  });
  return input;
}

function hdmiInput(mode: LinkMode): PreflightInput {
  const input = setAllModes(baseInput(), mode);
  input.request.dscPolicy = 'DISABLED';
  input.chain.nodes.forEach((item, index) => {
    item.port.inputTransports = index === 0 ? [] : ['HDMI'];
    item.port.outputTransports = index === input.chain.nodes.length - 1 ? [] : ['HDMI'];
  });
  return input;
}

export const DIAGNOSTIC_GOLDEN_CASES: DiagnosticGoldenCase[] = [
  {
    id: 'GOLDEN-EXACT-HBR3', purpose: '既知のHBR3経路が余裕を持って成立する', fixture: 'default 4K60 10b RGB / HBR3 x4',
    expected: { verdict: 'EXACT_PASS', bottleneckComponentId: 'source', proofCode: 'BANDWIDTH_SUFFICIENT', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'VESA公開HBR3 payload 25.92 Gbpsを使う', createInput: baseInput,
  },
  {
    id: 'GOLDEN-INTERMEDIATE-FAIL', purpose: '中間機器の既知不足を最初のボトルネックにする', fixture: 'dock only HBR2 x2 / DSC disabled',
    expected: { verdict: 'FAIL', bottleneckComponentId: 'dock', proofCode: 'BANDWIDTH_INSUFFICIENT', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'HBR2は8b/10bの公開値のみを使う', createInput: () => { const input = baseInput(); input.request.dscPolicy = 'DISABLED'; const dock = input.chain.nodes[1]; if (dock) dock.port.linkMode = LINK_MODES.DP_HBR2_2; return input; },
  },
  {
    id: 'GOLDEN-DSC-UNKNOWN', purpose: 'DSC継続性のunknownを条件へ伝播する', fixture: 'HBR2 x4 / dock DSC unknown',
    expected: { verdict: 'CONDITIONAL_PASS', unknownField: 'dscSupport', proofCode: 'FEATURE_UNKNOWN', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'DSC target bppはユーザー入力で、画質を保証しない', createInput: () => { const input = setAllModes(baseInput(), LINK_MODES.DP_HBR2_4); const dock = input.chain.nodes[1]; if (dock) dock.port.features.dscSupport = 'unknown'; return input; },
  },
  {
    id: 'GOLDEN-ALT-MODE-UNKNOWN', purpose: 'USB-C形状からAlt Mode対応を推測しない', fixture: 'USB-C HBR3 x4 / source Alt Mode unknown',
    expected: { verdict: 'INDETERMINATE', unknownField: 'altModeSupport', proofCode: 'DP_ALT_MODE_UNKNOWN', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'コネクター形状は能力の根拠にしない', createInput: () => { const input = setAllModes(baseInput(), LINK_MODES.USB_C_HBR3_4); input.chain.nodes.forEach((item, index) => { item.port.inputTransports = index === 0 ? [] : ['USB_C_DP_ALT_MODE']; item.port.outputTransports = index === input.chain.nodes.length - 1 ? [] : ['USB_C_DP_ALT_MODE']; item.port.altModeSupport = index === 0 ? 'unknown' : 'supported'; }); return input; },
  },
  {
    id: 'GOLDEN-DP-TWO-LANE-FAIL', purpose: '同一rateでも2 laneの不足を検出する', fixture: 'HBR3 x2 / DSC disabled',
    expected: { verdict: 'FAIL', bottleneckComponentId: 'source', proofCode: 'BANDWIDTH_INSUFFICIENT', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'lane数をversion labelと独立して評価する', createInput: () => { const input = setAllModes(baseInput(), LINK_MODES.DP_HBR3_2); input.request.dscPolicy = 'DISABLED'; return input; },
  },
  {
    id: 'GOLDEN-DP-FOUR-LANE-PASS', purpose: '4 laneでは同じ要求が成立する', fixture: 'HBR3 x4 / DSC disabled',
    expected: { verdict: 'EXACT_PASS', bottleneckComponentId: 'source', proofCode: 'BANDWIDTH_SUFFICIENT', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'lane数をversion labelと独立して評価する', createInput: () => { const input = setAllModes(baseInput(), LINK_MODES.DP_HBR3_4); input.request.dscPolicy = 'DISABLED'; return input; },
  },
  {
    id: 'GOLDEN-REVERSE-ADAPTER', purpose: '変換アダプターの逆方向を端子一致で通さない', fixture: 'DP source -> HDMI-to-DP adapter -> HDMI sink',
    expected: { verdict: 'FAIL', proofCode: 'INPUT_TRANSPORT_MISMATCH', sourceIds: ['vesa-dp20', 'hdmi-21b', 'ti-tmds'] },
    sourceAssumptions: 'adapterはinput/output transportを持つ有向ノード', createInput: () => { const input = baseInput(); input.chain.nodes = [node({ id: 'source', label: 'DP source', kind: 'source', direction: 'OUTPUT', outputTransports: ['DISPLAYPORT'] }), node({ id: 'adapter', label: 'HDMI to DP adapter', kind: 'adapter', direction: 'BIDIRECTIONAL', inputTransports: ['HDMI'], outputTransports: ['DISPLAYPORT'] }), node({ id: 'sink', label: 'HDMI sink', kind: 'sink', direction: 'INPUT', inputTransports: ['HDMI'] })]; input.chain.edges = [edge({ id: 'dp-cable', from: 'source', to: 'adapter', transport: 'DISPLAYPORT' }), edge({ id: 'hdmi-cable', from: 'adapter', to: 'sink', transport: 'HDMI', linkMode: LINK_MODES.HDMI_TMDS_18 })]; return input; },
  },
  {
    id: 'GOLDEN-HDR-UNSUPPORTED', purpose: '途中のHDR非対応を既知失敗にする', fixture: 'default / dock HDR unsupported',
    expected: { verdict: 'FAIL', proofCode: 'FEATURE_UNSUPPORTED', sourceIds: ['vesa-dp20'] },
    sourceAssumptions: 'HDRは帯域倍率でなく全区間の継続性として評価する', createInput: () => { const input = baseInput(); const dock = input.chain.nodes[1]; if (dock) dock.port.features.hdrSupport = 'unsupported'; return input; },
  },
  {
    id: 'GOLDEN-HDMI-TMDS-OVER', purpose: '既知TMDS不足はFRLへ暗黙昇格せずFAILにする', fixture: '4K60 10b RGB / HDMI TMDS 18G',
    expected: { verdict: 'FAIL', bottleneckComponentId: 'source', proofCode: 'BANDWIDTH_INSUFFICIENT', sourceIds: ['hdmi-21b', 'ti-tmds'] },
    sourceAssumptions: 'TMDS 18Gは公開8b/10b値、FRL能力を推測しない', createInput: () => hdmiInput(LINK_MODES.HDMI_TMDS_18),
  },
  {
    id: 'GOLDEN-HDMI-FRL-UNSUPPORTED', purpose: 'FRL精密payload非対応を成立扱いしない', fixture: 'HDMI FRL 48G unresolved',
    expected: { verdict: 'INDETERMINATE', unknownField: 'usablePayload', proofCode: 'COMPONENT_PAYLOAD_UNRESOLVED', sourceIds: ['hdmi-21b'] },
    sourceAssumptions: '公開概要のraw 48 Gbpsだけでは精密payloadを確定しない', createInput: () => hdmiInput(LINK_MODES.HDMI_FRL_48_UNRESOLVED),
  },
  {
    id: 'GOLDEN-PD-REDUCED', purpose: '必要電力は満たすが希望値未満を映像と独立して返す', fixture: '100W input / 10W reserve / 90W output',
    expected: { verdict: 'EXACT_PASS', proofCode: 'FINAL_VERDICT', sourceIds: ['vesa-dp20', 'usb-pd'] },
    sourceAssumptions: 'PDO交渉ではなく公開最大値のmin-chainモデル', createInput: () => { const input = baseInput(); if (input.powerRequest) { input.powerRequest.chargerMaxPowerW = 100; input.powerRequest.chargerMaxVoltageV = 20; input.powerRequest.cableMaxPowerW = 100; input.powerRequest.cableEprSupport = 'unsupported'; input.powerRequest.dockInputMaxPowerW = 100; input.powerRequest.dockReservePowerW = 10; input.powerRequest.dockHostOutputMaxPowerW = 90; input.powerRequest.hostRequiredPowerW = 65; input.powerRequest.hostPreferredPowerW = 100; } return input; },
  },
];
