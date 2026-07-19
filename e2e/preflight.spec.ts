import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function waitForHydration(page: Page): Promise<void> {
  await expect.poll(() => page.locator('astro-island').evaluate((element) => element.hasAttribute('ssr'))).toBe(false);
}

test('shows the complete default diagnosis path', async ({ page }) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  await page.goto('');
  await expect(page).toHaveTitle(/Signal Chain Preflight/);
  await expect(page.getByRole('heading', { name: /その映像・給電経路は/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '要求どおり成立します' })).toBeVisible();
  await page.getByText('USB Power Deliveryも評価する').click();
  await expect(page.getByLabel('充電器の最大電力')).toHaveValue('140');
  await expect(page.getByText('最初のボトルネック')).toBeVisible();
  await expect(page.getByRole('heading', { name: '判定根拠のステップ別証跡' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '規格ソース' })).toBeVisible();
  await expect(page.getByText(/v0\.1\.0-alpha\.1/).first()).toBeVisible();
  await expect(page.getByText(/schema 1 \/ commit/).first()).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('keeps unknown link capability indeterminate instead of assuming maximum', async ({ page }) => {
  await page.goto('');
  await waitForHydration(page);
  await page.getByLabel('最大リンク能力').nth(1).selectOption('unknown');
  await page.getByRole('button', { name: 'この経路を診断' }).click();
  await expect(page.getByRole('heading', { name: '情報不足で判定できません' })).toBeVisible();
  await expect(page.getByText(/中間ドック: 最大リンクレートとレーン数は何か/)).toBeVisible();
});

test('stores validated state in a versioned URL hash', async ({ page }) => {
  await page.goto('');
  await waitForHydration(page);
  await page.getByRole('button', { name: '共有URLを作成' }).click();
  await expect(page).toHaveURL(/#preflight=v1\./);
  await expect(page.getByText(/共有URLをコピーしました|URL hashへ保存しました/)).toBeVisible();
  await page.reload();
  await expect(page.getByText('共有状態を復元しました。')).toBeVisible();
  await expect(page.getByRole('heading', { name: '要求どおり成立します' })).toBeVisible();
});

test('exposes the alpha scope and keeps HDMI FRL indeterminate', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: '分かる範囲だけを、確定して返します。' })).toBeVisible();
  await expect(page.getByText('HDMI FRLの精密payload')).toBeVisible();
  await waitForHydration(page);
  await page.getByLabel('経路トランスポート').selectOption('HDMI');
  for (const select of await page.getByLabel('最大リンク能力').all()) await select.selectOption('HDMI_FRL_48_UNRESOLVED');
  for (const select of await page.getByLabel(/区間 \d+ ケーブル能力/).all()) await select.selectOption('HDMI_FRL_48_UNRESOLVED');
  await page.getByRole('button', { name: 'この経路を診断' }).click();
  await expect(page.getByRole('heading', { name: '情報不足で判定できません' })).toBeVisible();
  await expect(page.getByText(/HDMI FRLの精密payload判定はこのα版の非対応範囲/)).toBeVisible();
});

test('downloads a Zod-validated portable JSON report', async ({ page }) => {
  await page.goto('');
  await waitForHydration(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSONをダウンロード' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('signal-chain-preflight-report.json');
  await expect(page.getByText('診断レポートJSONをダウンロードしました。')).toBeVisible();
});

test('rejects malformed and oversized share states without crashing', async ({ page }) => {
  await page.goto('#preflight=v1.not-valid');
  await expect(page.getByText(/共有状態を復元できませんでした/)).toBeVisible();
  await page.goto(`#preflight=v1.${'a'.repeat(16_001)}`);
  await expect(page.getByText(/共有状態を復元できませんでした/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '要求どおり成立します' })).toBeVisible();
});

test('has no document-level horizontal overflow and exposes keyboard focus', async ({ page }) => {
  await page.goto('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});

test('serves a useful not-found page', async ({ page }) => {
  const response = await page.goto('404.html');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();
  await expect(page.getByRole('link', { name: '診断画面へ戻る' })).toHaveAttribute('href', '/Signal-Chain-Preflight/');
});
