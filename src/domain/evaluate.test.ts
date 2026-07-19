import { describe, expect, it } from 'vitest';
import { evaluatePreflight } from './evaluate';
import { baseInput, edge, node } from './fixtures';
import { LINK_MODES } from './standards';
import type { LinkMode, PreflightInput } from './types';

function setAllModes(input: PreflightInput, mode: LinkMode): void {
  input.chain.nodes.forEach((item) => { item.port.linkMode = mode; });
  input.chain.edges.forEach((item) => { item.capability.linkMode = mode; });
}

describe('evaluatePreflight representative cases', () => {
  it('Case A: known capabilities with headroom return EXACT_PASS', () => {
    const report = evaluatePreflight(baseInput());
    expect(report.verdict).toBe('EXACT_PASS');
    expect(report.requiredPayloadMbps).toBe(17_820);
    expect(report.availablePayloadMbps).toBe(25_920);
    expect(report.purchaseRequirements).toHaveLength(0);
    expect(report.proofSteps.at(-1)?.code).toBe('FINAL_VERDICT');
  });

  it('Case B: an insufficient dock is the bottleneck', () => {
    const input = baseInput();
    input.request.dscPolicy = 'DISABLED';
    const dock = input.chain.nodes[1];
    if (!dock) throw new Error('fixture missing dock');
    dock.port.linkMode = LINK_MODES.DP_HBR2_2;
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('FAIL');
    expect(report.bottleneck?.componentId).toBe('dock');
    expect(report.availablePayloadMbps).toBe(8_640);
    expect(report.purchaseRequirements).toContainEqual(expect.objectContaining({ targetComponentId: 'dock' }));
  });

  it('Case C: DSC-only bandwidth with unknown dock DSC is conditional', () => {
    const input = baseInput();
    setAllModes(input, LINK_MODES.DP_HBR2_4);
    const dock = input.chain.nodes[1];
    if (!dock) throw new Error('fixture missing dock');
    dock.port.features.dscSupport = 'unknown';
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('CONDITIONAL_PASS');
    expect(report.requiredPayloadMbps).toBe(4_752);
    expect(report.conditions.some((item) => item.code === 'CONFIRM_FEATURE_SUPPORT')).toBe(true);
    expect(report.unknowns.some((item) => item.field === 'dscSupport')).toBe(true);
  });

  it('Case D: a USB-C connector with unknown DP Alt Mode is indeterminate', () => {
    const input = baseInput();
    setAllModes(input, LINK_MODES.USB_C_HBR3_4);
    input.chain.nodes.forEach((item, index) => {
      item.port.inputTransports = index === 0 ? [] : ['USB_C_DP_ALT_MODE'];
      item.port.outputTransports = index === input.chain.nodes.length - 1 ? [] : ['USB_C_DP_ALT_MODE'];
    });
    input.chain.edges = [
      edge({ id: 'usb-c-1', from: 'source', to: 'dock', transport: 'USB_C_DP_ALT_MODE', linkMode: LINK_MODES.USB_C_HBR3_4 }),
      edge({ id: 'usb-c-2', from: 'dock', to: 'sink', transport: 'USB_C_DP_ALT_MODE', linkMode: LINK_MODES.USB_C_HBR3_4 }),
    ];
    const source = input.chain.nodes[0];
    if (!source) throw new Error('fixture missing source');
    source.port.altModeSupport = 'unknown';
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('INDETERMINATE');
    expect(report.unknowns).toContainEqual(expect.objectContaining({ field: 'altModeSupport', impactCode: 'USB_C_SHAPE_IS_NOT_ENOUGH' }));
  });

  it('Case E: four lanes pass while two lanes fail', () => {
    const fourLane = baseInput();
    fourLane.request.dscPolicy = 'DISABLED';
    setAllModes(fourLane, LINK_MODES.DP_HBR3_4);
    const twoLane = baseInput();
    twoLane.request.dscPolicy = 'DISABLED';
    setAllModes(twoLane, LINK_MODES.DP_HBR3_2);
    expect(evaluatePreflight(fourLane).verdict).toBe('EXACT_PASS');
    expect(evaluatePreflight(twoLane).verdict).toBe('FAIL');
  });

  it('Case F: a reversed conversion adapter fails directionally', () => {
    const input = baseInput();
    input.chain.nodes = [
      node({ id: 'source', label: 'DP source', kind: 'source', direction: 'OUTPUT', outputTransports: ['DISPLAYPORT'] }),
      node({ id: 'adapter', label: 'HDMI to DP adapter', kind: 'adapter', direction: 'BIDIRECTIONAL', inputTransports: ['HDMI'], outputTransports: ['DISPLAYPORT'] }),
      node({ id: 'sink', label: 'HDMI sink', kind: 'sink', direction: 'INPUT', inputTransports: ['HDMI'] }),
    ];
    input.chain.edges = [
      edge({ id: 'dp-cable', from: 'source', to: 'adapter', transport: 'DISPLAYPORT' }),
      edge({ id: 'hdmi-cable', from: 'adapter', to: 'sink', transport: 'HDMI', linkMode: LINK_MODES.HDMI_TMDS_18 }),
    ];
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('FAIL');
    expect(report.proofSteps.some((item) => item.code === 'INPUT_TRANSPORT_MISMATCH')).toBe(true);
  });

  it('Case G: unsupported HDR at an intermediate node fails', () => {
    const input = baseInput();
    const dock = input.chain.nodes[1];
    if (!dock) throw new Error('fixture missing dock');
    dock.port.features.hdrSupport = 'unsupported';
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('FAIL');
    expect(report.proofSteps).toContainEqual(expect.objectContaining({ code: 'FEATURE_UNSUPPORTED', componentId: 'dock' }));
  });

  it('Case H: an original failure keeps FAIL and offers a DSC fallback', () => {
    const input = baseInput();
    setAllModes(input, LINK_MODES.DP_HBR2_4);
    input.request.dscPolicy = 'DISABLED';
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('FAIL');
    expect(report.fallbacks).toContainEqual(expect.objectContaining({ id: 'enable-dsc', expectedVerdict: 'EXACT_PASS' }));
  });

  it('Case I: charger/cable/dock limits can indicate discharge under load', () => {
    const input = baseInput();
    input.powerRequest = {
      chargerMaxPowerW: 65, chargerMaxVoltageV: 20, cableMaxPowerW: 60, cableEprSupport: 'unsupported',
      dockInputMaxPowerW: 100, dockReservePowerW: 15, dockHostOutputMaxPowerW: 85,
      hostRequiredPowerW: 65, hostPreferredPowerW: 100,
    };
    const report = evaluatePreflight(input);
    expect(report.powerReport?.verdict).toBe('POSSIBLE_DISCHARGE_UNDER_LOAD');
    expect(report.powerReport?.theoreticalDeliverablePowerW).toBe(45);
  });

  it('Case J: unknown required capability is never treated as maximum', () => {
    const input = baseInput();
    const dock = input.chain.nodes[1];
    if (!dock) throw new Error('fixture missing dock');
    dock.port.linkMode = null;
    const report = evaluatePreflight(input);
    expect(report.verdict).toBe('INDETERMINATE');
    expect(report.availablePayloadMbps).toBeNull();
    expect(report.unknowns).toContainEqual(expect.objectContaining({ componentId: 'dock', field: 'linkMode' }));
  });
});
