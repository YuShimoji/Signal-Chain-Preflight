import type { LinkMode, Rational, VideoRequest } from './types';

export function multiplyRatioFloor(value: number, ratio: Rational): number {
  return Math.floor((value * ratio.numerator) / ratio.denominator);
}

export function multiplyRatioCeil(value: number, ratio: Rational): number {
  return Math.ceil((value * ratio.numerator) / ratio.denominator);
}

export function effectiveBitsPerPixel(request: VideoRequest, useDsc: boolean): Rational {
  if (useDsc) {
    const milliBits = Math.round((request.dscTargetBitsPerPixel ?? 0) * 1000);
    return { numerator: milliBits, denominator: 1000 };
  }
  if (request.chroma === 'YCBCR_422') return { numerator: request.bitsPerChannel * 2, denominator: 1 };
  if (request.chroma === 'YCBCR_420') return { numerator: request.bitsPerChannel * 3, denominator: 2 };
  return { numerator: request.bitsPerChannel * 3, denominator: 1 };
}

export function requiredPayloadMbps(request: VideoRequest, useDsc: boolean): number {
  const bpp = effectiveBitsPerPixel(request, useDsc);
  return Math.ceil((request.timing.pixelClockKHz * bpp.numerator) / (bpp.denominator * 1000));
}

export function availablePayloadMbps(mode: LinkMode): number | null {
  if (mode.payloadEfficiency === null || mode.evidence !== 'VERIFIED_PUBLIC') return null;
  return multiplyRatioFloor(mode.perLaneRateMbps * mode.laneCount, mode.payloadEfficiency);
}

export function calculateHeadroom(required: number, available: number): { mbps: number; percent: number } {
  const mbps = available - required;
  return { mbps, percent: Math.round((mbps * 1000) / available) / 10 };
}
