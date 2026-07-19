import type { PowerVerdict, PreflightReport, ProofStep, UnknownRequirement, Verdict } from '../domain/types';

export const verdictLabels: Record<Verdict, string> = {
  EXACT_PASS: '要求どおり成立します',
  CONDITIONAL_PASS: '条件を確認できれば成立します',
  FAIL: '要求どおりには成立しません',
  INDETERMINATE: '情報不足で判定できません',
};

export const verdictShort: Record<Verdict, string> = {
  EXACT_PASS: '成立', CONDITIONAL_PASS: '条件付き', FAIL: '不成立', INDETERMINATE: '判定不能',
};

export const powerLabels: Record<PowerVerdict, string> = {
  FULL_POWER: '希望電力まで供給可能',
  REDUCED_POWER: '必要電力は満たすが希望値未満',
  POSSIBLE_DISCHARGE_UNDER_LOAD: '高負荷時に放電する可能性',
  INDETERMINATE: '給電情報が不足',
};

const warningLabels: Record<string, string> = {
  HDR_WITH_8_BPC: 'HDR必須に対して8 bit指定です。10 bit以上を検討してください。',
  NEAR_LIMIT: '安全余裕の目安が5%未満です。標準要件ではなく、本ツールの注意基準です。',
  TIMING_IS_ESTIMATE: 'タイミングは概算値です。厳密判定には実際のpixel clockを確認してください。',
  CUSTOM_PIXEL_CLOCK_SUSPICIOUS_LOW: 'カスタムpixel clockが非常に低い値です。単位がkHzで、blankingを含む値か確認してください。',
  CUSTOM_PIXEL_CLOCK_SUSPICIOUS_HIGH: 'カスタムpixel clockが非常に高い値です。桁と単位がkHzか確認してください。',
  HDMI_FRL_UNSUPPORTED_SCOPE: 'HDMI FRLの精密payload判定はこのα版の非対応範囲です。TMDS不足をFRLで成立扱いにはしません。',
  POWER_MODEL_SIMPLIFIED: '給電判定は個別PDO/PPS/AVS交渉を再現しない理論上限です。',
  CABLE_NOT_EPR_CAPABLE: 'ケーブルがEPR非対応のため、100 Wを超える給電を見込みません。',
  CHARGER_VOLTAGE_TOO_LOW: '充電器の最大電圧が要求電力帯に不足しています。',
};

const questionLabels: Record<string, string> = {
  CHECK_MAX_LINK_MODE: '最大リンクレートとレーン数は何か',
  CHECK_USABLE_PAYLOAD: '公開情報で確認できる実効映像ペイロードは何Mbpsか',
  CHECK_DP_ALT_MODE: 'USB-CポートはDisplayPort Alt Modeに対応するか',
  CHECK_DSCSUPPORT: 'DSCを通過できるか',
  CHECK_HDRSUPPORT: 'HDRメタデータを通過できるか',
  CHECK_VRRSUPPORT: 'VRRを通過できるか',
  CHECK_VRR_RANGE: '対応するVRR範囲は何Hzから何Hzか',
  ENTER_DSC_TARGET_BPP: 'DSC target bits per pixelはいくつか',
};

const conditionLabels: Record<string, string> = {
  CONFIRM_FEATURE_SUPPORT: '必要機能の対応を確認してください',
  CONFIRM_VRR_RANGE: 'VRR範囲を確認してください',
  DSC_TARGET_BPP_REQUIRED: 'DSC使用時のtarget bppが必要です',
  POWER_VALUE_REQUIRED: '給電上限の未入力値を確認してください',
  CONFIRM_CABLE_EPR: 'ケーブルのEPR対応を確認してください',
  CONFIRM_CHARGER_MAX_VOLTAGE: '充電器の最大電圧を確認してください',
};

const fallbackLabels: Record<string, { title: string; tradeoff: string; rationale: string }> = {
  'enable-dsc': { title: 'DSCを使用する', tradeoff: '視覚的ロスレス圧縮を使用', rationale: '圧縮で必要ペイロードを下げます。' },
  'lower-refresh-rate': { title: 'リフレッシュレートを下げる', tradeoff: '動きの滑らかさが低下', rationale: '1秒あたりのpixel rateを下げます。' },
  'lower-color-depth': { title: '色深度を8 bitへ下げる', tradeoff: '階調精度が低下', rationale: '1pixelあたりのbit数を下げます。' },
  'use-422': { title: 'YCbCr 4:2:2を使用する', tradeoff: '色差の細部が低下', rationale: 'クロマ情報を間引き、必要ペイロードを下げます。' },
  'assess-displayport-path': { title: 'DisplayPort経路を別途確認する', tradeoff: '端子・機器・ケーブルの再確認が必要', rationale: '元のHDMI判定は変えず、別transportで成立可能性を再評価します。' },
};

export function warningText(code: string): string {
  return warningLabels[code] ?? code;
}

export function unknownText(item: UnknownRequirement): string {
  return questionLabels[item.questionCode] ?? item.questionCode;
}

export function conditionText(code: string): string {
  return conditionLabels[code] ?? code;
}

export function fallbackText(id: string): { title: string; tradeoff: string; rationale: string } {
  return fallbackLabels[id] ?? { title: id, tradeoff: '条件変更あり', rationale: '要求帯域または経路能力を変更します。' };
}

export function proofText(step: ProofStep): string {
  const v = step.values;
  switch (step.code) {
    case 'VIDEO_REQUIREMENT_CALCULATED': return `${v.timingMode}のpixel clock ${v.pixelClockKHz} kHz・${v.chroma}・${v.bitsPerChannel} bitから、必要ペイロードを${v.requiredPayloadMbps} Mbpsと計算しました。`;
    case 'COMPONENT_PAYLOAD_EVALUATED': return `${v.label}は${v.mode}として、利用可能ペイロード${v.availablePayloadMbps} Mbpsです。`;
    case 'COMPONENT_PAYLOAD_UNKNOWN': return `${v.label}の最大リンク能力が不明です。`;
    case 'COMPONENT_PAYLOAD_UNRESOLVED': return `${v.mode}は公開情報だけでは精密な映像ペイロードを確定できません。`;
    case 'KNOWN_BOTTLENECK_IDENTIFIED': return `既知能力の最小値は${v.label}の${v.availablePayloadMbps} Mbpsです。`;
    case 'BANDWIDTH_SUFFICIENT': return `必要${v.requiredPayloadMbps} Mbpsに対し、最小既知能力${v.availablePayloadMbps} Mbpsで成立します。`;
    case 'BANDWIDTH_INSUFFICIENT': return `必要${v.requiredPayloadMbps} Mbpsに対し、${v.availablePayloadMbps} Mbpsしかなく不足します。`;
    case 'DSC_PATH_SELECTED': return `DSC経路を評価します。target bppは${v.targetBitsPerPixel}です。`;
    case 'FEATURE_SUPPORTED': return `${v.label}の${String(v.feature).replace('Support', '')}対応を確認済みです。`;
    case 'FEATURE_UNKNOWN': return `${v.label}の${String(v.feature).replace('Support', '')}対応が不明です。`;
    case 'FEATURE_UNSUPPORTED': return `${v.label}は必要な${String(v.feature).replace('Support', '')}に非対応です。`;
    case 'DP_ALT_MODE_UNKNOWN': return 'USB-Cのコネクター形状だけではDisplayPort Alt Mode対応を判断できません。';
    case 'DP_ALT_MODE_UNSUPPORTED': return 'このUSB-CポートはDisplayPort Alt Modeに対応しません。';
    case 'INPUT_TRANSPORT_MISMATCH': return `入力方向が合いません。入力側は${v.incomingTransport}です。`;
    case 'OUTPUT_TRANSPORT_MISMATCH': return `出力方向が合いません。出力側は${v.outgoingTransport}です。`;
    case 'CABLE_TRANSPORT_UNSUPPORTED': return `ケーブルが${v.transport}を運べません。`;
    case 'FINAL_VERDICT': return `既知の失敗${v.hardFailureCount}件、不明${v.unknownCount}件から最終判定を${v.verdict}としました。`;
    default: return step.code.replaceAll('_', ' ').toLowerCase();
  }
}

export function verdictSentence(report: PreflightReport): string {
  if (report.verdict === 'EXACT_PASS') return `要求${report.requiredPayloadMbps.toLocaleString()} Mbpsに対し、経路全体の既知能力で成立します。`;
  if (report.verdict === 'FAIL' && report.bottleneck) return `${report.bottleneck.componentLabel}が最初の既知ボトルネックです。要求どおりには成立しません。`;
  if (report.verdict === 'CONDITIONAL_PASS') return `${report.conditions.length}件の条件を確認できれば、要求モードを維持できます。`;
  return `${report.unknowns.length}件の仕様情報が不足しています。最大能力を仮定せず、判定を保留しました。`;
}
