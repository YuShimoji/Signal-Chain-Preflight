import { z } from 'zod';
import { signalChainSchema, transportSchema, verdictSchema, videoRequestSchema } from './schemas';
import type { PreflightInput, PreflightReport } from './types';

const primitiveSchema = z.union([z.string(), z.number(), z.boolean()]);
const valuesSchema = z.record(z.string(), primitiveSchema);

export const diagnosticReportExportSchema = z.object({
  appVersion: z.string().min(1),
  buildCommit: z.string().min(1),
  buildDate: z.string().min(1),
  environment: z.enum(['development', 'production']),
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime(),
  requestedMode: videoRequestSchema,
  signalChain: signalChainSchema,
  verdict: verdictSchema,
  selectedTransport: transportSchema,
  requiredPayloadMbps: z.number().nonnegative(),
  availablePayloadMbps: z.number().nonnegative().nullable(),
  bottleneck: z.object({
    componentId: z.string(), componentLabel: z.string(), componentKind: z.string(),
    availablePayloadMbps: z.number().nonnegative(), reasonCode: z.string(),
  }).nullable(),
  conditions: z.array(z.object({ code: z.string(), componentId: z.string().nullable(), values: valuesSchema })),
  warnings: z.array(z.string()),
  unknowns: z.array(z.object({
    componentId: z.string(), componentLabel: z.string(), field: z.string(), questionCode: z.string(), impactCode: z.string(),
  })),
  proofs: z.array(z.object({ index: z.number().int().positive(), code: z.string(), componentId: z.string().nullable(), values: valuesSchema })),
  fallbacks: z.array(z.object({
    id: z.string(), changedFields: valuesSchema, expectedVerdict: verdictSchema,
    qualityTradeoffCode: z.string(), requiredComponentChanges: z.array(z.string()), rationaleCode: z.string(),
  })),
  power: z.object({
    verdict: z.enum(['FULL_POWER', 'REDUCED_POWER', 'POSSIBLE_DISCHARGE_UNDER_LOAD', 'INDETERMINATE']),
    theoreticalDeliverablePowerW: z.number().nonnegative().nullable(),
    conditions: z.array(z.object({ code: z.string(), componentId: z.string().nullable(), values: valuesSchema })),
    warnings: z.array(z.string()),
    proofSteps: z.array(z.object({ index: z.number().int().positive(), code: z.string(), componentId: z.string().nullable(), values: valuesSchema })),
  }).nullable(),
  sourceIds: z.array(z.string()),
  unsupportedScopes: z.array(z.string()),
});

export type DiagnosticReportExport = z.infer<typeof diagnosticReportExportSchema>;

export const ALPHA_UNSUPPORTED_SCOPES = [
  'HDMI FRL exact payload',
  'USB4 and Thunderbolt tunneling',
  'MST and multiple displays',
  'HDCP and eARC',
  'OS and driver constraints',
  'cable length and physical signal integrity',
  'product-model compatibility guarantees',
] as const;

type Provenance = Pick<DiagnosticReportExport, 'appVersion' | 'buildCommit' | 'buildDate' | 'environment'>;

const localPathPattern = /(?:[a-z]:\\Users\\[^\s"'<>]+|[a-z]:\/Users\/[^\s"'<>]+|\/(?:Users|home)\/[^\s"'<>]+)/gi;

function redactLocalPaths<T>(value: T): T {
  if (typeof value === 'string') return value.replace(localPathPattern, '[redacted-local-path]') as T;
  if (Array.isArray(value)) return value.map((item) => redactLocalPaths(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactLocalPaths(item)])) as T;
  }
  return value;
}

export function buildDiagnosticReportExport(
  input: PreflightInput,
  report: PreflightReport,
  provenance: Provenance,
  generatedAt = new Date().toISOString(),
): DiagnosticReportExport {
  const candidate = redactLocalPaths({
    appVersion: provenance.appVersion,
    buildCommit: provenance.buildCommit,
    buildDate: provenance.buildDate,
    environment: provenance.environment,
    schemaVersion: 1 as const,
    generatedAt,
    requestedMode: report.requestedMode,
    signalChain: input.chain,
    verdict: report.verdict,
    selectedTransport: report.selectedTransport,
    requiredPayloadMbps: report.requiredPayloadMbps,
    availablePayloadMbps: report.availablePayloadMbps,
    bottleneck: report.bottleneck,
    conditions: report.conditions,
    warnings: report.warnings,
    unknowns: report.unknowns,
    proofs: report.proofSteps,
    fallbacks: report.fallbacks,
    power: report.powerReport,
    sourceIds: report.sourceReferences.map((source) => source.id).sort(),
    unsupportedScopes: [...ALPHA_UNSUPPORTED_SCOPES],
  });
  return diagnosticReportExportSchema.parse(candidate);
}

export function stringifyDiagnosticReport(report: DiagnosticReportExport): string {
  return `${JSON.stringify(diagnosticReportExportSchema.parse(report), null, 2)}\n`;
}
