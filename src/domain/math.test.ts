import { describe, expect, it } from 'vitest';
import { availablePayloadMbps, requiredPayloadMbps } from './math';
import { baseInput } from './fixtures';
import { LINK_MODES } from './standards';
import { preflightInputSchema } from './schemas';

describe('integer bandwidth math', () => {
  it('uses the official HBR3 4-lane public payload', () => {
    expect(availablePayloadMbps(LINK_MODES.DP_HBR3_4)).toBe(25_920);
  });

  it('rejects NaN, Infinity, negative and unsafe pixel clocks', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1, 20_000_001]) {
      const input = baseInput();
      input.request.timing.pixelClockKHz = value;
      expect(preflightInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it('keeps unresolved HDMI FRL payload out of deterministic comparisons', () => {
    expect(availablePayloadMbps(LINK_MODES.HDMI_FRL_48_UNRESOLVED)).toBeNull();
  });

  it('calculates chroma and DSC payload without floating verdict drift', () => {
    const input = baseInput();
    expect(requiredPayloadMbps(input.request, false)).toBe(17_820);
    expect(requiredPayloadMbps(input.request, true)).toBe(4_752);
    input.request.chroma = 'YCBCR_420';
    expect(requiredPayloadMbps(input.request, false)).toBe(8_910);
  });
});
