import { availablePayloadMbps, calculateHeadroom, requiredPayloadMbps } from './math';
import { evaluatePower } from './power';
import { preflightInputSchema } from './schemas';
import { NEAR_LIMIT_PERCENT, SOURCE_REFERENCES } from './standards';
import type {
  Bottleneck,
  CapabilityState,
  ChainEdge,
  ChainNode,
  EvaluationCondition,
  FallbackOption,
  FeatureCapability,
  LinkMode,
  PreflightInput,
  PreflightReport,
  ProofStep,
  PurchaseRequirement,
  UnknownRequirement,
  Verdict,
} from './types';

type CapacityComponent = {
  id: string;
  label: string;
  kind: ChainNode['kind'] | ChainEdge['kind'];
  mode: LinkMode | null;
  features: FeatureCapability;
};

type StructuralCheck = {
  failures: string[];
  coreUnknown: boolean;
};

function categoryFor(component: CapacityComponent): PurchaseRequirement['category'] {
  if (component.kind === 'dock') return 'usb-c-dock';
  if (component.kind === 'adapter') return 'adapter';
  if (component.kind === 'displayPortCable') return 'displayport-cable';
  if (component.kind === 'hdmiCable') return 'hdmi-cable';
  if (component.kind === 'usbCCable') return 'usb-c-cable';
  return 'unknown-component';
}

function getComponents(input: PreflightInput): CapacityComponent[] {
  const components: CapacityComponent[] = [];
  input.chain.nodes.forEach((node, index) => {
    components.push({ id: node.id, label: node.label, kind: node.kind, mode: node.port.linkMode, features: node.port.features });
    const edge = input.chain.edges[index];
    if (edge) components.push({ id: edge.id, label: edge.label, kind: edge.kind, mode: edge.capability.linkMode, features: edge.capability.features });
  });
  return components;
}

export function evaluatePreflight(rawInput: unknown): PreflightReport {
  const input = preflightInputSchema.parse(rawInput);
  const proofSteps: ProofStep[] = [];
  const conditions: EvaluationCondition[] = [];
  const warnings: string[] = [];
  const unknowns: UnknownRequirement[] = [];
  const hardFailures: string[] = [];
  const conditionalFeatureIds = new Set<string>();
  const sourceIds = new Set<string>();
  const components = getComponents(input);

  const proof = (code: string, componentId: string | null, values: ProofStep['values'] = {}) => {
    proofSteps.push({ index: proofSteps.length + 1, code, componentId, values });
  };
  const addUnknown = (item: UnknownRequirement) => {
    if (!unknowns.some((current) => current.componentId === item.componentId && current.field === item.field)) unknowns.push(item);
  };
  const addCondition = (code: string, componentId: string | null, values: EvaluationCondition['values'] = {}) => {
    if (!conditions.some((current) => current.code === code && current.componentId === componentId)) conditions.push({ code, componentId, values });
  };

  const uncompressedRequired = requiredPayloadMbps(input.request, false);
  proof('VIDEO_REQUIREMENT_CALCULATED', null, {
    timingMode: input.request.timing.mode,
    pixelClockKHz: input.request.timing.pixelClockKHz,
    chroma: input.request.chroma,
    bitsPerChannel: input.request.bitsPerChannel,
    requiredPayloadMbps: uncompressedRequired,
  });

  const structural = checkStructure(input, proof, addUnknown);
  hardFailures.push(...structural.failures);

  let knownMinimum: { component: CapacityComponent; available: number } | null = null;
  let capacityUnknown = false;
  for (const component of components) {
    if (component.mode === null) {
      capacityUnknown = true;
      addUnknown({ componentId: component.id, componentLabel: component.label, field: 'linkMode', questionCode: 'CHECK_MAX_LINK_MODE', impactCode: 'BANDWIDTH_CANNOT_BE_CONFIRMED' });
      proof('COMPONENT_PAYLOAD_UNKNOWN', component.id, { label: component.label });
      continue;
    }
    component.mode.sourceReferenceIds.forEach((id) => sourceIds.add(id));
    const available = availablePayloadMbps(component.mode);
    if (available === null) {
      capacityUnknown = true;
      if (component.mode.id === 'HDMI_FRL_48_UNRESOLVED' && !warnings.includes('HDMI_FRL_UNSUPPORTED_SCOPE')) {
        warnings.push('HDMI_FRL_UNSUPPORTED_SCOPE');
      }
      addUnknown({ componentId: component.id, componentLabel: component.label, field: 'usablePayload', questionCode: 'CHECK_USABLE_PAYLOAD', impactCode: 'PUBLIC_DATA_UNRESOLVED' });
      proof('COMPONENT_PAYLOAD_UNRESOLVED', component.id, { mode: component.mode.label });
      continue;
    }
    proof('COMPONENT_PAYLOAD_EVALUATED', component.id, { label: component.label, mode: component.mode.label, availablePayloadMbps: available });
    if (knownMinimum === null || available < knownMinimum.available) knownMinimum = { component, available };
  }

  if (knownMinimum) proof('KNOWN_BOTTLENECK_IDENTIFIED', knownMinimum.component.id, { availablePayloadMbps: knownMinimum.available, label: knownMinimum.component.label });

  evaluateRequiredFeature('hdrSupport', input.request.hdrRequired, components, input, proof, addUnknown, addCondition, hardFailures, conditionalFeatureIds);
  evaluateRequiredFeature('vrrSupport', input.request.vrrRequired, components, input, proof, addUnknown, addCondition, hardFailures, conditionalFeatureIds);

  let useDsc = input.request.dscPolicy === 'REQUIRED';
  const knownBandwidthFailsUncompressed = knownMinimum !== null && knownMinimum.available < uncompressedRequired;
  if (input.request.dscPolicy === 'ALLOWED' && knownBandwidthFailsUncompressed && input.request.dscTargetBitsPerPixel !== null) useDsc = true;

  if (useDsc && input.request.dscTargetBitsPerPixel === null) {
    addUnknown({ componentId: 'request', componentLabel: '映像要求', field: 'dscTargetBitsPerPixel', questionCode: 'ENTER_DSC_TARGET_BPP', impactCode: 'DSC_PAYLOAD_CANNOT_BE_CALCULATED' });
    addCondition('DSC_TARGET_BPP_REQUIRED', null);
    capacityUnknown = true;
  }

  if (useDsc) {
    evaluateRequiredFeature('dscSupport', true, components, input, proof, addUnknown, addCondition, hardFailures, conditionalFeatureIds);
    proof('DSC_PATH_SELECTED', null, { policy: input.request.dscPolicy, targetBitsPerPixel: input.request.dscTargetBitsPerPixel ?? 'unknown' });
  }

  const required = useDsc && input.request.dscTargetBitsPerPixel !== null ? requiredPayloadMbps(input.request, true) : uncompressedRequired;
  const bandwidthFails = knownMinimum !== null && knownMinimum.available < required;
  if (bandwidthFails && knownMinimum) {
    hardFailures.push('INSUFFICIENT_BANDWIDTH');
    proof('BANDWIDTH_INSUFFICIENT', knownMinimum.component.id, { requiredPayloadMbps: required, availablePayloadMbps: knownMinimum.available });
  } else if (!capacityUnknown && knownMinimum) {
    proof('BANDWIDTH_SUFFICIENT', knownMinimum.component.id, { requiredPayloadMbps: required, availablePayloadMbps: knownMinimum.available });
  }

  if (input.request.hdrRequired && input.request.bitsPerChannel === 8) warnings.push('HDR_WITH_8_BPC');

  const headroom = knownMinimum ? calculateHeadroom(required, knownMinimum.available) : null;
  if (!bandwidthFails && !capacityUnknown && headroom && headroom.percent < NEAR_LIMIT_PERCENT) warnings.push('NEAR_LIMIT');
  if (input.request.timing.mode === 'CVT_RB2_ESTIMATE') warnings.push('TIMING_IS_ESTIMATE');
  if (input.request.timing.mode === 'CUSTOM_PIXEL_CLOCK' && input.request.timing.pixelClockKHz < 10_000) warnings.push('CUSTOM_PIXEL_CLOCK_SUSPICIOUS_LOW');
  if (input.request.timing.mode === 'CUSTOM_PIXEL_CLOCK' && input.request.timing.pixelClockKHz > 5_000_000) warnings.push('CUSTOM_PIXEL_CLOCK_SUSPICIOUS_HIGH');

  let verdict: Verdict;
  if (hardFailures.length > 0) verdict = 'FAIL';
  else if (capacityUnknown || structural.coreUnknown) verdict = 'INDETERMINATE';
  else if (conditionalFeatureIds.size > 0) verdict = 'CONDITIONAL_PASS';
  else verdict = 'EXACT_PASS';

  const bottleneck: Bottleneck | null = knownMinimum ? {
    componentId: knownMinimum.component.id,
    componentLabel: knownMinimum.component.label,
    componentKind: knownMinimum.component.kind,
    availablePayloadMbps: knownMinimum.available,
    reasonCode: bandwidthFails ? 'FIRST_INSUFFICIENT_CAPABILITY' : 'LOWEST_KNOWN_CAPABILITY',
  } : null;

  const fallbacks = buildFallbacks(input, verdict, knownMinimum?.available ?? null, components, hardFailures);
  const purchaseRequirements = buildPurchaseRequirements(components, bottleneck, unknowns, required, useDsc, verdict);
  const powerReport = input.powerRequest ? evaluatePower(input.powerRequest) : null;
  if (powerReport) sourceIds.add('usb-pd');
  proof('FINAL_VERDICT', null, { verdict, hardFailureCount: hardFailures.length, unknownCount: unknowns.length });

  return {
    schemaVersion: 1,
    verdict,
    requestedMode: input.request,
    selectedTransport: input.chain.edges[0]?.transport ?? 'UNKNOWN',
    requiredPayloadMbps: required,
    availablePayloadMbps: capacityUnknown ? null : (knownMinimum?.available ?? null),
    headroomMbps: capacityUnknown ? null : (headroom?.mbps ?? null),
    headroomPercent: capacityUnknown ? null : (headroom?.percent ?? null),
    bottleneck,
    conditions,
    warnings,
    unknowns,
    proofSteps,
    fallbacks,
    purchaseRequirements,
    powerReport,
    sourceReferences: SOURCE_REFERENCES.filter((source) => sourceIds.has(source.id)),
  };
}

function checkStructure(
  input: PreflightInput,
  proof: (code: string, componentId: string | null, values?: ProofStep['values']) => void,
  addUnknown: (item: UnknownRequirement) => void,
): StructuralCheck {
  const failures: string[] = [];
  let coreUnknown = false;
  const { nodes, edges } = input.chain;
  if (edges.length !== nodes.length - 1) {
    failures.push('CHAIN_NOT_LINEAR');
    proof('CHAIN_NOT_LINEAR', null, { nodes: nodes.length, edges: edges.length });
  }

  nodes.forEach((node, index) => {
    const incoming = edges[index - 1];
    const outgoing = edges[index];
    if (index === 0 && node.port.direction === 'INPUT') {
      failures.push('SOURCE_DIRECTION_INVALID');
      proof('SOURCE_DIRECTION_INVALID', node.id);
    }
    if (index === nodes.length - 1 && node.port.direction === 'OUTPUT') {
      failures.push('SINK_DIRECTION_INVALID');
      proof('SINK_DIRECTION_INVALID', node.id);
    }
    if (incoming) {
      if (incoming.toNodeId !== node.id || !node.port.inputTransports.includes(incoming.transport)) {
        failures.push('INPUT_TRANSPORT_MISMATCH');
        proof('INPUT_TRANSPORT_MISMATCH', node.id, { incomingTransport: incoming.transport });
      }
    }
    if (outgoing) {
      if (outgoing.fromNodeId !== node.id || !node.port.outputTransports.includes(outgoing.transport)) {
        failures.push('OUTPUT_TRANSPORT_MISMATCH');
        proof('OUTPUT_TRANSPORT_MISMATCH', node.id, { outgoingTransport: outgoing.transport });
      }
    }
  });

  edges.forEach((edge) => {
    if (!edge.capability.transports.includes(edge.transport)) {
      failures.push('CABLE_TRANSPORT_UNSUPPORTED');
      proof('CABLE_TRANSPORT_UNSUPPORTED', edge.id, { transport: edge.transport });
    }
    if (edge.transport === 'USB_C_DP_ALT_MODE') {
      const adjacent = nodes.filter((node) => node.id === edge.fromNodeId || node.id === edge.toNodeId);
      adjacent.forEach((node) => {
        if (node.port.altModeSupport === 'unsupported') {
          failures.push('DP_ALT_MODE_UNSUPPORTED');
          proof('DP_ALT_MODE_UNSUPPORTED', node.id);
        } else if (node.port.altModeSupport === 'unknown') {
          coreUnknown = true;
          addUnknown({ componentId: node.id, componentLabel: node.label, field: 'altModeSupport', questionCode: 'CHECK_DP_ALT_MODE', impactCode: 'USB_C_SHAPE_IS_NOT_ENOUGH' });
          proof('DP_ALT_MODE_UNKNOWN', node.id);
        }
      });
    }
  });
  return { failures, coreUnknown };
}

function evaluateRequiredFeature(
  feature: keyof Pick<FeatureCapability, 'dscSupport' | 'hdrSupport' | 'vrrSupport'>,
  required: boolean,
  components: CapacityComponent[],
  input: PreflightInput,
  proof: (code: string, componentId: string | null, values?: ProofStep['values']) => void,
  addUnknown: (item: UnknownRequirement) => void,
  addCondition: (code: string, componentId: string | null, values?: EvaluationCondition['values']) => void,
  hardFailures: string[],
  conditionalFeatureIds: Set<string>,
): void {
  if (!required) return;
  components.forEach((component) => {
    const state: CapabilityState = component.features[feature];
    if (state === 'unsupported') {
      hardFailures.push(`${feature.toUpperCase()}_UNSUPPORTED`);
      proof('FEATURE_UNSUPPORTED', component.id, { feature, label: component.label });
    } else if (state === 'unknown') {
      conditionalFeatureIds.add(`${component.id}:${feature}`);
      addUnknown({ componentId: component.id, componentLabel: component.label, field: feature, questionCode: `CHECK_${feature.toUpperCase()}`, impactCode: 'FEATURE_CONTINUITY_NOT_CONFIRMED' });
      addCondition('CONFIRM_FEATURE_SUPPORT', component.id, { feature });
      proof('FEATURE_UNKNOWN', component.id, { feature, label: component.label });
    } else {
      proof('FEATURE_SUPPORTED', component.id, { feature, label: component.label });
    }

    if (feature === 'vrrSupport' && state === 'supported' && input.request.vrrRequired) {
      const requestedMin = input.request.vrrMinHz;
      const requestedMax = input.request.vrrMaxHz ?? input.request.refreshRateHz;
      if (requestedMin !== null || input.request.vrrMaxHz !== null) {
        const range = component.features.vrrRange;
        if (range === null) {
          conditionalFeatureIds.add(`${component.id}:vrrRange`);
          addUnknown({ componentId: component.id, componentLabel: component.label, field: 'vrrRange', questionCode: 'CHECK_VRR_RANGE', impactCode: 'VRR_RANGE_NOT_CONFIRMED' });
          addCondition('CONFIRM_VRR_RANGE', component.id, { requestedMin: requestedMin ?? 0, requestedMax });
        } else if ((requestedMin !== null && requestedMin < range.minHz) || requestedMax > range.maxHz) {
          hardFailures.push('VRR_RANGE_UNSUPPORTED');
          proof('VRR_RANGE_UNSUPPORTED', component.id, { supportedMin: range.minHz, supportedMax: range.maxHz, requestedMin: requestedMin ?? 0, requestedMax });
        }
      }
    }
  });
}

function buildFallbacks(
  input: PreflightInput,
  verdict: Verdict,
  available: number | null,
  components: CapacityComponent[],
  hardFailures: string[],
): FallbackOption[] {
  if (verdict !== 'FAIL' || available === null || !hardFailures.includes('INSUFFICIENT_BANDWIDTH')) return [];
  const options: FallbackOption[] = [];
  const allDscSupported = components.every((component) => component.features.dscSupport === 'supported');
  if (input.request.dscPolicy !== 'REQUIRED' && input.request.dscTargetBitsPerPixel !== null && allDscSupported) {
    const compressed = requiredPayloadMbps(input.request, true);
    if (compressed <= available) options.push({
      id: 'enable-dsc', changedFields: { dscPolicy: 'REQUIRED', dscTargetBitsPerPixel: input.request.dscTargetBitsPerPixel }, expectedVerdict: 'EXACT_PASS',
      qualityTradeoffCode: 'VISUALLY_LOSSLESS_COMPRESSION', requiredComponentChanges: [], rationaleCode: 'DSC_REDUCES_REQUIRED_PAYLOAD',
    });
  }

  const currentRequired = requiredPayloadMbps(input.request, false);
  const safeRefresh = Math.floor((input.request.refreshRateHz * available * 0.99) / currentRequired);
  if (safeRefresh >= 24 && safeRefresh < input.request.refreshRateHz) options.push({
    id: 'lower-refresh-rate', changedFields: { refreshRateHz: safeRefresh }, expectedVerdict: 'EXACT_PASS',
    qualityTradeoffCode: 'LOWER_MOTION_SMOOTHNESS', requiredComponentChanges: [], rationaleCode: 'LOWER_REFRESH_REDUCES_PIXEL_RATE',
  });
  if (input.request.bitsPerChannel > 8) options.push({
    id: 'lower-color-depth', changedFields: { bitsPerChannel: 8 }, expectedVerdict: 'CONDITIONAL_PASS',
    qualityTradeoffCode: 'LOWER_GRADATION_PRECISION', requiredComponentChanges: [], rationaleCode: 'LOWER_BPC_REDUCES_PAYLOAD',
  });
  if (input.request.chroma === 'RGB' || input.request.chroma === 'YCBCR_444') options.push({
    id: 'use-422', changedFields: { chroma: 'YCBCR_422' }, expectedVerdict: 'CONDITIONAL_PASS',
    qualityTradeoffCode: 'REDUCED_CHROMA_DETAIL', requiredComponentChanges: [], rationaleCode: 'CHROMA_SUBSAMPLING_REDUCES_PAYLOAD',
  });
  if (input.chain.edges[0]?.transport === 'HDMI') options.push({
    id: 'assess-displayport-path', changedFields: { selectedTransport: 'DISPLAYPORT' }, expectedVerdict: 'INDETERMINATE',
    qualityTradeoffCode: 'ALTERNATE_TRANSPORT_REQUIRES_VERIFICATION', requiredComponentChanges: ['source', 'cable', 'sink'],
    rationaleCode: 'DISPLAYPORT_MAY_OFFER_A_DIFFERENT_CAPACITY_PATH',
  });
  return options;
}

function buildPurchaseRequirements(
  components: CapacityComponent[],
  bottleneck: Bottleneck | null,
  unknowns: UnknownRequirement[],
  requiredPayload: number,
  useDsc: boolean,
  verdict: Verdict,
): PurchaseRequirement[] {
  const result: PurchaseRequirement[] = [];
  const targetIds = new Set<string>();
  if (bottleneck && verdict === 'FAIL') targetIds.add(bottleneck.componentId);
  unknowns.forEach((unknown) => targetIds.add(unknown.componentId));
  targetIds.forEach((id) => {
    const component = components.find((candidate) => candidate.id === id);
    if (!component) return;
    result.push({
      category: categoryFor(component), targetComponentId: component.id,
      mustHave: [
        `usable video payload >= ${requiredPayload} Mbps`,
        'maximum link rate and lane count disclosed',
        ...(useDsc ? ['DSC pass-through explicitly supported'] : []),
      ],
      avoid: ['maximum resolution or version label only; link capability not disclosed'],
    });
  });
  return result;
}
