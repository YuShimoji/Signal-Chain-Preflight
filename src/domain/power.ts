import type { EvaluationCondition, PowerReport, PowerRequest, ProofStep } from './types';

const fields: (keyof PowerRequest)[] = [
  'chargerMaxPowerW', 'cableMaxPowerW', 'dockInputMaxPowerW', 'dockReservePowerW',
  'dockHostOutputMaxPowerW', 'hostRequiredPowerW', 'hostPreferredPowerW',
];

export function evaluatePower(request: PowerRequest): PowerReport {
  const proofSteps: ProofStep[] = [];
  const conditions: EvaluationCondition[] = [];
  const warnings: string[] = ['POWER_MODEL_SIMPLIFIED'];
  const missing = fields.filter((field) => request[field] === null);
  if (missing.length > 0) {
    missing.forEach((field) => conditions.push({ code: 'POWER_VALUE_REQUIRED', componentId: null, values: { field } }));
    proofSteps.push({ index: 1, code: 'POWER_INDETERMINATE_MISSING_VALUES', componentId: null, values: { count: missing.length } });
    return { verdict: 'INDETERMINATE', theoreticalDeliverablePowerW: null, conditions, warnings, proofSteps };
  }

  const charger = request.chargerMaxPowerW as number;
  let cable = request.cableMaxPowerW as number;
  const input = request.dockInputMaxPowerW as number;
  const reserve = request.dockReservePowerW as number;
  const output = request.dockHostOutputMaxPowerW as number;
  const required = request.hostRequiredPowerW as number;
  const preferred = request.hostPreferredPowerW as number;

  const eprRelevant = Math.max(charger, cable, input, output, required, preferred) > 100;
  if (eprRelevant && request.cableEprSupport === 'unknown') {
    conditions.push({ code: 'CONFIRM_CABLE_EPR', componentId: null, values: {} });
    proofSteps.push({ index: 1, code: 'POWER_EPR_UNKNOWN', componentId: null, values: {} });
    return { verdict: 'INDETERMINATE', theoreticalDeliverablePowerW: null, conditions, warnings, proofSteps };
  }
  if (eprRelevant && request.cableEprSupport === 'unsupported') {
    cable = Math.min(cable, 100);
    warnings.push('CABLE_NOT_EPR_CAPABLE');
  }

  const voltageNeeded = required > 180 ? 48 : required > 140 ? 36 : required > 100 ? 28 : 20;
  if (voltageNeeded > 20 && request.chargerMaxVoltageV === null) {
    conditions.push({ code: 'CONFIRM_CHARGER_MAX_VOLTAGE', componentId: null, values: { voltageNeeded } });
    return { verdict: 'INDETERMINATE', theoreticalDeliverablePowerW: null, conditions, warnings, proofSteps: [{ index: 1, code: 'POWER_VOLTAGE_UNKNOWN', componentId: null, values: { voltageNeeded } }] };
  }
  if (voltageNeeded > (request.chargerMaxVoltageV ?? 20)) warnings.push('CHARGER_VOLTAGE_TOO_LOW');

  const inbound = Math.min(charger, cable, input);
  const afterReserve = Math.max(0, inbound - reserve);
  const deliverable = Math.min(afterReserve, output);
  proofSteps.push({ index: 1, code: 'POWER_INPUT_MINIMUM', componentId: null, values: { charger, cable, dockInput: input, inbound } });
  proofSteps.push({ index: 2, code: 'POWER_AFTER_DOCK_RESERVE', componentId: null, values: { inbound, reserve, afterReserve } });
  proofSteps.push({ index: 3, code: 'POWER_OUTPUT_LIMIT', componentId: null, values: { afterReserve, output, deliverable } });

  let verdict: PowerReport['verdict'];
  if (deliverable >= preferred) verdict = 'FULL_POWER';
  else if (deliverable >= required) verdict = 'REDUCED_POWER';
  else verdict = 'POSSIBLE_DISCHARGE_UNDER_LOAD';
  proofSteps.push({ index: 4, code: 'POWER_VERDICT', componentId: null, values: { deliverable, required, preferred, verdict } });
  return { verdict, theoreticalDeliverablePowerW: deliverable, conditions, warnings, proofSteps };
}
