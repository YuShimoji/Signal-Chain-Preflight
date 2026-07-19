export const APP_VERSION = '0.1.0-alpha.1';
export const REPORT_SCHEMA_VERSION = 1 as const;

export type BuildProvenance = {
  appVersion: string;
  buildCommit: string;
  buildDate: string;
  environment: 'development' | 'production';
};

export const BUILD_PROVENANCE: BuildProvenance = {
  appVersion: APP_VERSION,
  buildCommit: import.meta.env.PUBLIC_BUILD_COMMIT || 'local',
  buildDate: import.meta.env.PUBLIC_BUILD_DATE || 'local',
  environment: import.meta.env.PROD ? 'production' : 'development',
};

export function shortCommit(commit: string): string {
  return commit === 'local' ? commit : commit.slice(0, 7);
}
