import { LINK_MODES } from './standards';
import type { CapabilityState, ChainEdge, ChainNode, FeatureCapability, LinkMode, PreflightInput, Transport } from './types';

export const SUPPORTED_FEATURES: FeatureCapability = {
  dscSupport: 'supported', hdrSupport: 'supported', vrrSupport: 'supported', vrrRange: { minHz: 40, maxHz: 240 },
};

export function features(overrides: Partial<FeatureCapability> = {}): FeatureCapability {
  return { ...SUPPORTED_FEATURES, ...overrides };
}

type NodeOptions = {
  id: string;
  label: string;
  kind: ChainNode['kind'];
  direction: ChainNode['port']['direction'];
  inputTransports?: Transport[];
  outputTransports?: Transport[];
  linkMode?: LinkMode | null;
  altModeSupport?: CapabilityState;
  featureOverrides?: Partial<FeatureCapability>;
};

export function node(options: NodeOptions): ChainNode {
  return {
    id: options.id, label: options.label, kind: options.kind,
    port: {
      direction: options.direction,
      inputTransports: options.inputTransports ?? [], outputTransports: options.outputTransports ?? [],
      linkMode: options.linkMode === undefined ? LINK_MODES.DP_HBR3_4 : options.linkMode,
      altModeSupport: options.altModeSupport ?? 'supported', features: features(options.featureOverrides),
    },
  };
}

type EdgeOptions = {
  id: string;
  from: string;
  to: string;
  transport?: Transport;
  linkMode?: LinkMode | null;
  kind?: ChainEdge['kind'];
  featureOverrides?: Partial<FeatureCapability>;
};

export function edge(options: EdgeOptions): ChainEdge {
  const transport = options.transport ?? 'DISPLAYPORT';
  return {
    id: options.id, label: options.id, fromNodeId: options.from, toNodeId: options.to, transport,
    kind: options.kind ?? (transport === 'HDMI' ? 'hdmiCable' : transport === 'USB_C_DP_ALT_MODE' ? 'usbCCable' : 'displayPortCable'),
    capability: {
      transports: [transport], linkMode: options.linkMode === undefined ? LINK_MODES.DP_HBR3_4 : options.linkMode,
      features: features(options.featureOverrides), maxPowerW: transport === 'USB_C_DP_ALT_MODE' ? 240 : null,
      eprSupport: transport === 'USB_C_DP_ALT_MODE' ? 'supported' : 'unknown',
    },
  };
}

export function baseInput(): PreflightInput {
  return {
    schemaVersion: 1,
    request: {
      width: 3840, height: 2160, refreshRateHz: 60, bitsPerChannel: 10, chroma: 'RGB',
      timing: { mode: 'CUSTOM_PIXEL_CLOCK', pixelClockKHz: 594000, presetId: null },
      dscPolicy: 'ALLOWED', dscTargetBitsPerPixel: 8, hdrRequired: true, vrrRequired: false, vrrMinHz: null, vrrMaxHz: null,
    },
    chain: {
      nodes: [
        node({ id: 'source', label: '映像ソース', kind: 'source', direction: 'OUTPUT', outputTransports: ['DISPLAYPORT'] }),
        node({ id: 'dock', label: '中間ドック', kind: 'dock', direction: 'BIDIRECTIONAL', inputTransports: ['DISPLAYPORT'], outputTransports: ['DISPLAYPORT'] }),
        node({ id: 'sink', label: 'ディスプレイ', kind: 'sink', direction: 'INPUT', inputTransports: ['DISPLAYPORT'] }),
      ],
      edges: [
        edge({ id: 'cable-1', from: 'source', to: 'dock' }),
        edge({ id: 'cable-2', from: 'dock', to: 'sink' }),
      ],
    },
    powerRequest: {
      chargerMaxPowerW: 140, chargerMaxVoltageV: 28, cableMaxPowerW: 240, cableEprSupport: 'supported',
      dockInputMaxPowerW: 140, dockReservePowerW: 15, dockHostOutputMaxPowerW: 100,
      hostRequiredPowerW: 65, hostPreferredPowerW: 100,
    },
  };
}
