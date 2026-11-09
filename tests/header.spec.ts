import { expect, test } from '@playwright/test';

test('header preserves the documented layout and uses real local assets at both baseline widths', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 1080 });
    await page.goto('/preview/navigation');
    const header = page.getByRole('banner');
    const search = page.getByRole('combobox', { name: 'Поиск по каталогу' });
    await expect(header.getByText('AI&Data Hub', { exact: true })).toBeVisible();
    expect(await header.boundingBox()).toEqual({ x: 0, y: 0, width, height: 48 });
    const field = search.locator('..');
    expect(await field.boundingBox()).toEqual({ x: 295, y: 8, width: width - 593, height: 32 });
    expect(await header.locator('[aria-label="Профиль пользователя"]').boundingBox())
      .toEqual({ x: width - 56, y: 4, width: 40, height: 40 });
    await expect(header).toHaveCSS('background-color', 'rgb(0, 123, 251)');
    await expect(header.getByText('AI&Data Hub', { exact: true })).toHaveCSS('font-weight', '500');
    await expect(search).toHaveCSS('font-weight', '400');
    expect(await search.evaluate((input) => getComputedStyle(input).fontFamily)).toContain('CoFo Sans');
    await page.evaluate(() => document.fonts.ready);
    for (const image of await header.locator('img').all()) {
      expect(await image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    await header.screenshot({ path: `verification/current/header/header-${width}.png` });
    await search.fill('Проверка ввода');
    await expect(search).toHaveValue('Проверка ввода');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('aside')).toBeVisible();
    await search.fill('');
    await search.press('Escape');
    await search.blur();
    if (width === 1440) await page.screenshot({ path: 'verification/current/header/context.png', fullPage: true });
  }
  expect(errors).toEqual([]);
});
