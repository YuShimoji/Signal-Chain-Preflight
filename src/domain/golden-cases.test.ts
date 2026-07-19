import { describe, expect, it } from 'vitest';
import { evaluatePreflight } from './evaluate';
import { DIAGNOSTIC_GOLDEN_CASES } from './golden-cases';

describe('documented diagnostic golden cases', () => {
  it.each(DIAGNOSTIC_GOLDEN_CASES)('$id — $purpose', (golden) => {
    const report = evaluatePreflight(golden.createInput());
    expect(report.verdict).toBe(golden.expected.verdict);
    if (golden.expected.bottleneckComponentId) expect(report.bottleneck?.componentId).toBe(golden.expected.bottleneckComponentId);
    if (golden.expected.unknownField) expect(report.unknowns.some((item) => item.field === golden.expected.unknownField)).toBe(true);
    expect(report.proofSteps.some((item) => item.code === golden.expected.proofCode)).toBe(true);
    expect(report.sourceReferences.map((source) => source.id)).toEqual(expect.arrayContaining(golden.expected.sourceIds));
  });

  it('never returns EXACT_PASS for the unsupported HDMI FRL case', () => {
    const golden = DIAGNOSTIC_GOLDEN_CASES.find((item) => item.id === 'GOLDEN-HDMI-FRL-UNSUPPORTED');
    if (!golden) throw new Error('FRL golden case missing');
    const report = evaluatePreflight(golden.createInput());
    expect(report.verdict).toBe('INDETERMINATE');
    expect(report.warnings).toContain('HDMI_FRL_UNSUPPORTED_SCOPE');
  });

  it('keeps a TMDS failure while offering another transport only as indeterminate', () => {
    const golden = DIAGNOSTIC_GOLDEN_CASES.find((item) => item.id === 'GOLDEN-HDMI-TMDS-OVER');
    if (!golden) throw new Error('TMDS golden case missing');
    const report = evaluatePreflight(golden.createInput());
    expect(report.verdict).toBe('FAIL');
    expect(report.fallbacks).toContainEqual(expect.objectContaining({ id: 'assess-displayport-path', expectedVerdict: 'INDETERMINATE' }));
  });
});
