import { expect, test } from '@playwright/test';

for (const section of ['reports', 'home', 'sources']) {
  test(`${section}: column reset closes, restores focus, preserves other filters and header height`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/preview/navigation?section=${section}`);
    const source = section === 'sources';
    const heading = page.getByRole('button', { name: source ? 'Фильтр: Домен' : 'Фильтр «Домен»', exact: true });
    const geometry = await heading.evaluate(button => {
      const cell = button.closest('[role="columnheader"],th')!;
      const style = getComputedStyle(cell);
      return { height: cell.getBoundingClientRect().height, top: style.paddingTop, bottom: style.paddingBottom, surface: button.parentElement!.getBoundingClientRect().height };
    });
    expect(geometry).toEqual({ height: source ? 52 : 48, top: '8px', bottom: '8px', surface: 32 });
    await heading.click();
    let menu = page.getByRole('dialog', { name: 'Фильтр: Домен', exact: true });
    await menu.getByRole('checkbox', { name: 'Гостеприимство', exact: true }).check();
    await menu.getByRole('button', { name: 'Применить', exact: true }).click();
    const count = async () => page.locator(source ? '[data-source-id]' : '[data-table-report-id]').count();
    const domainCount = await count();
    const second = page.getByRole('button', { name: source ? 'Фильтр: Источник' : 'Фильтр «Мастер-система»', exact: true });
    await second.click();
    menu = page.getByRole('dialog', { name: source ? 'Фильтр: Источник' : 'Фильтр: Мастер-система', exact: true });
    await menu.getByRole('checkbox', { name: source ? 'SQL Server' : '1С ЖКХ', exact: true }).check();
    await menu.getByRole('button', { name: 'Применить', exact: true }).click();
    await second.click();
    await menu.getByRole('button', { name: 'Сбросить', exact: true }).click();
    await expect(menu).toHaveCount(0);
    await expect(second).toBeFocused();
    await expect.poll(count).toBe(domainCount);
    await expect(page.getByRole('button', { name: source ? 'Сбросить фильтр: Домен' : 'Сбросить фильтр «Домен»', exact: true })).toBeVisible();
    await second.click();
    await expect(menu.getByRole('checkbox', { checked: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await heading.hover();
    await page.screenshot({ path: `verification/column-reset/${section}-heading.png` });
  });
}

test('range reset removes the applied range and preserves the domain', async ({ page }) => {
  await page.goto('/preview/navigation?section=reports');
  await page.getByRole('button', { name: 'Фильтр «Домен»', exact: true }).click();
  let menu = page.getByRole('dialog', { name: 'Фильтр: Домен', exact: true });
  await menu.getByRole('checkbox', { name: 'Гостеприимство', exact: true }).check();
  await menu.getByRole('button', { name: 'Применить', exact: true }).click();
  const before = await page.locator('[data-table-report-id]').count();
  const heading = page.getByRole('button', { name: 'Фильтр «MAU»', exact: true });
  await heading.click();
  menu = page.getByRole('dialog', { name: 'Фильтр: MAU', exact: true });
  await menu.getByRole('spinbutton', { name: 'MAU: от', exact: true }).fill('100');
  await menu.getByRole('button', { name: 'Применить', exact: true }).click();
  await heading.click();
  await menu.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('[data-table-report-id]')).toHaveCount(before);
  await expect(page.getByRole('button', { name: 'Сбросить фильтр «MAU»', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Сбросить фильтр «Домен»', exact: true })).toBeVisible();
});
