import { expect, test } from '@playwright/test';

test('header and sidebar edges match report card borders in both themes', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/navigation?section=reports');
  const header = page.getByRole('banner');
  const sidebar = page.locator('aside[data-collapsed]');
  const resizeHandle = sidebar.getByRole('separator', { name: 'Ширина боковой панели' });
  const themeToggle = header.getByRole('button', { name: 'Тёмная тема', exact: true });
  const search = header.locator('[data-appearance="header"]').filter({
    has: page.getByRole('combobox', { name: 'Поиск по каталогу' }),
  });
  await page.getByRole('button', { name: 'Карточный вид', exact: true }).click();
  const card = page.locator('[data-card-report-id]').first();
  const sidebarEdge = () => sidebar.evaluate(element => {
    const edge = getComputedStyle(element, '::after');
    return { thickness: edge.borderRightWidth, color: edge.borderRightColor, style: edge.borderRightStyle };
  });

  for (const [theme, color] of [
    ['light', 'rgb(215, 230, 245)'],
    ['dark', 'rgb(66, 69, 76)'],
  ]) {
    const dark = theme === 'dark';
    if ((await themeToggle.getAttribute('aria-pressed') === 'true') !== dark) await themeToggle.click();
    await page.mouse.move(3, 3);
    await expect(page.locator('html')).toHaveAttribute('data-catalog-theme', theme);
    const edge = { thickness: '1px', color, style: 'solid' };
    await expect(card).toHaveCSS('border-top', `1px solid ${color}`);
    expect(await sidebarEdge()).toEqual(edge);
    await resizeHandle.hover({ position: { x: 12, y: 160 } });
    expect(await sidebarEdge()).toEqual(edge);
    await page.mouse.move(3, 3);
    expect(await header.evaluate(element => {
      const edge = getComputedStyle(element, '::after');
      return {
        thickness: edge.borderBottomWidth,
        color: edge.borderBottomColor,
        style: edge.borderBottomStyle,
        width: edge.width,
        bottom: edge.bottom,
        pointerEvents: edge.pointerEvents,
      };
    })).toEqual({ ...edge, width: '1440px', bottom: '0px', pointerEvents: 'none' });
    await expect(search).toHaveCSS('border', `1px solid ${color}`);
    expect(await header.boundingBox()).toEqual({ x: 0, y: 0, width: 1440, height: 48 });
    await page.screenshot({ path: info.outputPath('global-header-boundary-' + theme + '.png'),
      clip: { x: 0, y: 0, width: 1440, height: 156 } });
  }

  await sidebar.getByRole('button', { name: 'Свернуть панель', exact: true }).click();
  await page.mouse.move(3, 3);
  await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  expect(await sidebar.evaluate(element => getComputedStyle(element, '::after').borderRight))
    .toBe(await header.evaluate(element => getComputedStyle(element, '::after').borderBottom));
});

test('profile menu toggles on click and stays open when choosing a demo item', async ({ page }, info) => {
  await page.goto('/preview/navigation?section=reports');
  const avatar = page.getByRole('button', { name: 'Профиль пользователя' });
  const menu = page.getByRole('menu', { name: 'Профиль пользователя' });
  const search = page.getByRole('combobox', { name: 'Поиск по каталогу' });
  const initialUrl = page.url();

  await avatar.hover();
  await expect(menu).toHaveCount(0);
  await avatar.click();
  await expect(avatar).toHaveAttribute('aria-expanded', 'true');
  const items = menu.getByRole('menuitem');
  await expect(items).toHaveText(['Профиль', 'Админка', 'Выйти']);
  await expect(items.locator('svg')).toHaveCount(3);
  await items.first().hover();
  await expect(items.first()).toHaveCSS('background-color', 'rgb(243, 244, 249)');
  await expect(items.first()).toHaveCSS('outline-style', 'none');
  await page.screenshot({ path: info.outputPath('profile-menu.png'), animations: 'disabled' });
  for (const item of await items.all()) {
    await item.click();
    await expect(menu).toBeVisible();
    await expect(page).toHaveURL(initialUrl);
  }

  await search.hover();
  await expect(menu).toBeVisible();
  await avatar.click();
  await expect(menu).toHaveCount(0);
  await avatar.click();
  await search.click();
  await expect(menu).toHaveCount(0);
  await expect(search).toBeFocused();

  await avatar.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('[data-highlighted]')).toHaveCSS('outline-color', 'rgb(0, 123, 252)');
  await expect(menu.locator('[data-highlighted]')).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(avatar).toBeFocused();
});

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
