import type { z } from 'zod';
import type {
  capabilityStateSchema,
  cableCapabilitySchema,
  chainEdgeSchema,
  chainNodeSchema,
  featureCapabilitySchema,
  linkModeSchema,
  portCapabilitySchema,
  powerRequestSchema,
  preflightInputSchema,
  rationalSchema,
  signalChainSchema,
  sourceReferenceSchema,
  transportSchema,
  verdictSchema,
  videoRequestSchema,
  videoTimingSchema,
} from './schemas';

export type CapabilityState = z.infer<typeof capabilityStateSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type Transport = z.infer<typeof transportSchema>;
export type Rational = z.infer<typeof rationalSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type LinkMode = z.infer<typeof linkModeSchema>;
export type VideoTiming = z.infer<typeof videoTimingSchema>;
export type VideoRequest = z.infer<typeof videoRequestSchema>;
export type FeatureCapability = z.infer<typeof featureCapabilitySchema>;
export type PortCapability = z.infer<typeof portCapabilitySchema>;
export type CableCapability = z.infer<typeof cableCapabilitySchema>;
export type ChainNode = z.infer<typeof chainNodeSchema>;
export type ChainEdge = z.infer<typeof chainEdgeSchema>;
export type SignalChain = z.infer<typeof signalChainSchema>;
export type PowerRequest = z.infer<typeof powerRequestSchema>;
export type PreflightInput = z.infer<typeof preflightInputSchema>;

export type EvaluationCondition = {
  code: string;
  componentId: string | null;
  values: Record<string, string | number | boolean>;
};

export type Bottleneck = {
  componentId: string;
  componentLabel: string;
  componentKind: ChainNode['kind'] | ChainEdge['kind'];
  availablePayloadMbps: number;
  reasonCode: string;
};

export type ProofStep = {
  index: number;
  code: string;
  componentId: string | null;
  values: Record<string, string | number | boolean>;
};

export type UnknownRequirement = {
  componentId: string;
  componentLabel: string;
  field: string;
  questionCode: string;
  impactCode: string;
};

export type FallbackOption = {
  id: string;
  changedFields: Record<string, string | number | boolean>;
  expectedVerdict: Verdict;
  qualityTradeoffCode: string;
  requiredComponentChanges: string[];
  rationaleCode: string;
};

export type PurchaseRequirement = {
  category: 'displayport-cable' | 'hdmi-cable' | 'usb-c-cable' | 'usb-c-dock' | 'adapter' | 'charger' | 'unknown-component';
  targetComponentId: string | null;
  mustHave: string[];
  avoid: string[];
};

export type PowerVerdict = 'FULL_POWER' | 'REDUCED_POWER' | 'POSSIBLE_DISCHARGE_UNDER_LOAD' | 'INDETERMINATE';

export type PowerReport = {
  verdict: PowerVerdict;
  theoreticalDeliverablePowerW: number | null;
  conditions: EvaluationCondition[];
  warnings: string[];
  proofSteps: ProofStep[];
};

export type PreflightReport = {
  schemaVersion: 1;
  verdict: Verdict;
  requestedMode: VideoRequest;
  selectedTransport: Transport;
  requiredPayloadMbps: number;
  availablePayloadMbps: number | null;
  headroomMbps: number | null;
  headroomPercent: number | null;
  bottleneck: Bottleneck | null;
  conditions: EvaluationCondition[];
  warnings: string[];
  unknowns: UnknownRequirement[];
  proofSteps: ProofStep[];
  fallbacks: FallbackOption[];
  purchaseRequirements: PurchaseRequirement[];
  powerReport: PowerReport | null;
  sourceReferences: SourceReference[];
};
