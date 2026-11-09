import { expect, test } from '@playwright/test';

test('loads, retrieves demo data, supports history and a direct route, loads the provided font', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const demoRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/__prototype_demo__/diagnostics')) demoRequests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Каталог данных — подготовка прототипа');
  await expect(page.getByRole('heading', { name: 'Среда прототипа подготовлена' })).toBeVisible();
  await page.getByRole('link', { name: 'Проверить источник данных' }).click();
  await expect(page).toHaveURL(/\/diagnostics$/);
  await expect(page.getByRole('status')).toHaveText('Пример загружен: 3 строки.');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(4);
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Не подключён', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Среда прототипа подготовлена' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('table')).toBeVisible();
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((font) => font.family.replaceAll('"', '') === 'CoFo Sans')
      .map((font) => ({ weight: font.weight, status: font.status }));
  });
  expect(fonts).toEqual(expect.arrayContaining([
    { weight: '400', status: 'loaded' }, { weight: '500', status: 'loaded' },
  ]));
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  if (testInfo.project.name === 'production') {
    expect(demoRequests).toHaveLength(0);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  } else {
    expect(demoRequests.length).toBeGreaterThan(0);
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  }
  const prefix = testInfo.project.name === 'production' ? 'production' : 'foundation';
  await page.screenshot({ path: `verification/${prefix}-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `verification/${prefix}-narrow.png`, fullPage: true });
  expect(errors).toEqual([]);
});
