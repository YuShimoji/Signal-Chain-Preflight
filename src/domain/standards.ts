import type { LinkMode, SourceReference } from './types';

export const CHECKED_AT = '2026-07-18';

export const SOURCE_REFERENCES: SourceReference[] = [
  {
    id: 'vesa-dp20', organization: 'VESA', title: 'VESA Publishes DisplayPort 2.0 Video Standard',
    url: 'https://vesa.org/press/vesa-publishes-displayport-2-0-video-standard-enabling-support-for-beyond-8k-resolutions-higher-refresh-rates-for-4k-hdr-and-virtual-reality-applications/',
    publishedAt: '2019-06-26', checkedAt: CHECKED_AT, revision: 'DisplayPort 2.0 public overview', accessLevel: 'public',
    notes: 'HBR3 raw 32.4 Gbps and payload 25.92 Gbps; UHBR20 raw 80 Gbps and public maximum payload 77.37 Gbps.',
  },
  {
    id: 'vesa-uhbr', organization: 'VESA', title: 'DisplayPort UHBR Device and Cable Certification',
    url: 'https://vesa.org/featured-articles/vesa-readies-displayport-uhbr-ultra-high-bit-rate-device-certification-and-begins-certification-of-uhbr-cables/',
    publishedAt: '2022-02-28', checkedAt: CHECKED_AT, revision: 'UHBR certification overview', accessLevel: 'public',
    notes: 'Confirms UHBR10, UHBR13.5 and UHBR20 link rates and four-lane DP40/DP80 cable capability.',
  },
  {
    id: 'hdmi-21b', organization: 'HDMI Licensing Administrator', title: 'HDMI 2.1b Specification overview',
    url: 'https://www.hdmi.org/spec/hdmi2_1/index.aspx', publishedAt: null, checkedAt: CHECKED_AT,
    revision: '2.1b public overview', accessLevel: 'public-overview', notes: 'Confirms bandwidth up to 48 Gbps; does not expose enough detail here for exact FRL video payload.',
  },
  {
    id: 'ti-tmds', organization: 'Texas Instruments', title: 'FPD-Link IO Interfaces: HDMI',
    url: 'https://www.ti.com/video/5503353893001', publishedAt: null, checkedAt: CHECKED_AT,
    revision: null, accessLevel: 'public', notes: 'Public technical explanation of TMDS 8b/10b encoding.',
  },
  {
    id: 'usb-pd', organization: 'USB Implementers Forum', title: 'USB Charger (USB Power Delivery)',
    url: 'https://www.usb.org/usb-charger-pd', publishedAt: null, checkedAt: CHECKED_AT,
    revision: 'USB PD 3.1 public overview', accessLevel: 'public', notes: 'Confirms EPR fixed voltages 28/36/48 V and 140/180/240 W levels.',
  },
];

const dpMode = (id: string, label: string, rate: number, lanes: 2 | 4, uhbr = false, transport: LinkMode['transport'] = 'DISPLAYPORT'): LinkMode => ({
  id, label, transport, perLaneRateMbps: rate, laneCount: lanes,
  payloadEfficiency: uhbr ? { numerator: 7737, denominator: 8000 } : { numerator: 4, denominator: 5 },
  evidence: 'VERIFIED_PUBLIC', sourceReferenceIds: uhbr ? ['vesa-dp20', 'vesa-uhbr'] : ['vesa-dp20'],
});

export const LINK_MODES = {
  DP_HBR2_2: dpMode('DP_HBR2_2', 'DP HBR2・2レーン', 5400, 2),
  DP_HBR2_4: dpMode('DP_HBR2_4', 'DP HBR2・4レーン', 5400, 4),
  DP_HBR3_2: dpMode('DP_HBR3_2', 'DP HBR3・2レーン', 8100, 2),
  DP_HBR3_4: dpMode('DP_HBR3_4', 'DP HBR3・4レーン', 8100, 4),
  DP_UHBR10_4: dpMode('DP_UHBR10_4', 'DP UHBR10・4レーン', 10000, 4, true),
  DP_UHBR13_5_4: dpMode('DP_UHBR13_5_4', 'DP UHBR13.5・4レーン', 13500, 4, true),
  DP_UHBR20_4: dpMode('DP_UHBR20_4', 'DP UHBR20・4レーン', 20000, 4, true),
  USB_C_HBR2_2: dpMode('USB_C_HBR2_2', 'USB-C DP Alt Mode・HBR2・2レーン', 5400, 2, false, 'USB_C_DP_ALT_MODE'),
  USB_C_HBR3_2: dpMode('USB_C_HBR3_2', 'USB-C DP Alt Mode・HBR3・2レーン', 8100, 2, false, 'USB_C_DP_ALT_MODE'),
  USB_C_HBR3_4: dpMode('USB_C_HBR3_4', 'USB-C DP Alt Mode・HBR3・4レーン', 8100, 4, false, 'USB_C_DP_ALT_MODE'),
  HDMI_TMDS_18: {
    id: 'HDMI_TMDS_18', label: 'HDMI TMDS 18 Gbps', transport: 'HDMI', perLaneRateMbps: 6000, laneCount: 3,
    payloadEfficiency: { numerator: 4, denominator: 5 }, evidence: 'VERIFIED_PUBLIC', sourceReferenceIds: ['hdmi-21b', 'ti-tmds'],
  } satisfies LinkMode,
  HDMI_FRL_48_UNRESOLVED: {
    id: 'HDMI_FRL_48_UNRESOLVED', label: 'HDMI FRL 48 Gbps（精密payload未解決）', transport: 'HDMI', perLaneRateMbps: 12000, laneCount: 4,
    payloadEfficiency: null, evidence: 'UNRESOLVED_PUBLIC', sourceReferenceIds: ['hdmi-21b'],
  } satisfies LinkMode,
} as const satisfies Record<string, LinkMode>;

export type LinkModeId = keyof typeof LINK_MODES;

export const NEAR_LIMIT_PERCENT = 5;
