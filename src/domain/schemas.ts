import { z } from 'zod';

export const capabilityStateSchema = z.enum(['supported', 'unsupported', 'unknown']);
export const verdictSchema = z.enum(['EXACT_PASS', 'CONDITIONAL_PASS', 'FAIL', 'INDETERMINATE']);
export const transportSchema = z.enum(['DISPLAYPORT', 'HDMI', 'USB_C_DP_ALT_MODE', 'UNKNOWN']);
export const featureCapabilitySchema = z.object({
  dscSupport: capabilityStateSchema,
  hdrSupport: capabilityStateSchema,
  vrrSupport: capabilityStateSchema,
  vrrRange: z.object({ minHz: z.number().positive(), maxHz: z.number().positive() }).nullable(),
});
export const rationalSchema = z.object({ numerator: z.number().int().positive(), denominator: z.number().int().positive() });
export const sourceReferenceSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  publishedAt: z.string().nullable(),
  checkedAt: z.string(),
  revision: z.string().nullable(),
  accessLevel: z.enum(['public', 'public-overview', 'restricted']),
  notes: z.string(),
});
export const linkModeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  transport: transportSchema,
  perLaneRateMbps: z.number().int().positive(),
  laneCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  payloadEfficiency: rationalSchema.nullable(),
  evidence: z.enum(['VERIFIED_PUBLIC', 'UNRESOLVED_PUBLIC']),
  sourceReferenceIds: z.array(z.string()),
});
export const videoTimingSchema = z.object({
  mode: z.enum(['PRESET', 'CVT_RB2_ESTIMATE', 'CUSTOM_PIXEL_CLOCK']),
  pixelClockKHz: z.number().int().min(1).max(20_000_000),
  presetId: z.string().nullable(),
});
export const videoRequestSchema = z.object({
  width: z.number().int().min(320).max(15360),
  height: z.number().int().min(200).max(8640),
  refreshRateHz: z.number().positive().max(1000),
  bitsPerChannel: z.union([z.literal(8), z.literal(10), z.literal(12)]),
  chroma: z.enum(['RGB', 'YCBCR_444', 'YCBCR_422', 'YCBCR_420']),
  timing: videoTimingSchema,
  dscPolicy: z.enum(['DISABLED', 'ALLOWED', 'REQUIRED']),
  dscTargetBitsPerPixel: z.number().positive().max(24).nullable(),
  hdrRequired: z.boolean(),
  vrrRequired: z.boolean(),
  vrrMinHz: z.number().positive().nullable(),
  vrrMaxHz: z.number().positive().nullable(),
});
export const portCapabilitySchema = z.object({
  direction: z.enum(['OUTPUT', 'INPUT', 'BIDIRECTIONAL']),
  inputTransports: z.array(transportSchema),
  outputTransports: z.array(transportSchema),
  linkMode: linkModeSchema.nullable(),
  altModeSupport: capabilityStateSchema,
  features: featureCapabilitySchema,
});
export const cableCapabilitySchema = z.object({
  transports: z.array(transportSchema),
  linkMode: linkModeSchema.nullable(),
  features: featureCapabilitySchema,
  maxPowerW: z.number().positive().nullable(),
  eprSupport: capabilityStateSchema,
});
export const chainNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['source', 'sink', 'dock', 'adapter', 'genericPassThrough']),
  label: z.string().min(1),
  port: portCapabilitySchema,
});
export const chainEdgeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['hdmiCable', 'displayPortCable', 'usbCCable', 'genericCable']),
  label: z.string().min(1),
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  transport: transportSchema,
  capability: cableCapabilitySchema,
});
export const signalChainSchema = z.object({
  nodes: z.array(chainNodeSchema).min(2).max(4),
  edges: z.array(chainEdgeSchema).min(1).max(3),
});
export const powerRequestSchema = z.object({
  chargerMaxPowerW: z.number().nonnegative().nullable(),
  chargerMaxVoltageV: z.number().nonnegative().nullable(),
  cableMaxPowerW: z.number().nonnegative().nullable(),
  cableEprSupport: capabilityStateSchema,
  dockInputMaxPowerW: z.number().nonnegative().nullable(),
  dockReservePowerW: z.number().nonnegative().nullable(),
  dockHostOutputMaxPowerW: z.number().nonnegative().nullable(),
  hostRequiredPowerW: z.number().nonnegative().nullable(),
  hostPreferredPowerW: z.number().nonnegative().nullable(),
});
export const preflightInputSchema = z.object({
  schemaVersion: z.literal(1),
  request: videoRequestSchema,
  chain: signalChainSchema,
  powerRequest: powerRequestSchema.nullable(),
});

export type PreflightInputData = z.infer<typeof preflightInputSchema>;
