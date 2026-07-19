import { describe, expect, it } from 'vitest';
import { evaluatePower } from './power';

describe('power evaluation', () => {
  it('returns INDETERMINATE when EPR cable capability is unknown', () => {
    const report = evaluatePower({
      chargerMaxPowerW: 140, chargerMaxVoltageV: 28, cableMaxPowerW: 240, cableEprSupport: 'unknown',
      dockInputMaxPowerW: 140, dockReservePowerW: 10, dockHostOutputMaxPowerW: 140,
      hostRequiredPowerW: 120, hostPreferredPowerW: 140,
    });
    expect(report.verdict).toBe('INDETERMINATE');
    expect(report.conditions).toContainEqual(expect.objectContaining({ code: 'CONFIRM_CABLE_EPR' }));
  });

  it('returns reduced power when required power is met but preferred is not', () => {
    const report = evaluatePower({
      chargerMaxPowerW: 100, chargerMaxVoltageV: 20, cableMaxPowerW: 100, cableEprSupport: 'unsupported',
      dockInputMaxPowerW: 100, dockReservePowerW: 10, dockHostOutputMaxPowerW: 90,
      hostRequiredPowerW: 65, hostPreferredPowerW: 100,
    });
    expect(report.verdict).toBe('REDUCED_POWER');
    expect(report.theoreticalDeliverablePowerW).toBe(90);
  });
});
