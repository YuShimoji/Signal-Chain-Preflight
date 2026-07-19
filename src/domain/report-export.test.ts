import { describe, expect, it } from 'vitest';
import { evaluatePreflight } from './evaluate';
import { baseInput } from './fixtures';
import { buildDiagnosticReportExport, diagnosticReportExportSchema, stringifyDiagnosticReport } from './report-export';

const provenance = {
  appVersion: '0.1.0-alpha.1', buildCommit: 'abcdef123456', buildDate: '2026-07-19T00:00:00Z', environment: 'production' as const,
};

describe('portable diagnostic report export', () => {
  it('contains stable provenance, input, verdict, evidence and power fields', () => {
    const input = baseInput();
    const exported = buildDiagnosticReportExport(input, evaluatePreflight(input), provenance, '2026-07-19T01:02:03.000Z');
    expect(diagnosticReportExportSchema.parse(exported)).toEqual(exported);
    expect(exported).toMatchObject({
      appVersion: '0.1.0-alpha.1', buildCommit: 'abcdef123456', schemaVersion: 1,
      verdict: 'EXACT_PASS', selectedTransport: 'DISPLAYPORT', generatedAt: '2026-07-19T01:02:03.000Z',
    });
    expect(exported.signalChain.nodes).toHaveLength(3);
    expect(exported.proofs.length).toBeGreaterThan(0);
    expect(exported.sourceIds).toContain('vesa-dp20');
    expect(exported.power).not.toBeNull();
  });

  it('redacts local home paths and serializes with a trailing newline', () => {
    const input = baseInput();
    const first = input.chain.nodes[0];
    if (!first) throw new Error('fixture missing source');
    first.label = 'C:\\Users\\private-name\\case.json';
    const json = stringifyDiagnosticReport(buildDiagnosticReportExport(input, evaluatePreflight(input), provenance));
    expect(json).not.toContain('private-name');
    expect(json).toContain('[redacted-local-path]');
    expect(json.endsWith('\n')).toBe(true);
  });
});
