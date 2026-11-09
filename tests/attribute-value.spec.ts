import { expect, test } from '@playwright/test';

test('missing attributes use the same one-pixel line in lists, cards and detail views', async ({ page }) => {
  const locations = [
    ['section=systems&systems.view=list', 'main table'],
    ['section=systems&systems.reference=crm', '[aria-label="Метаданные CRM"]'],
    ['segment=favorites', '[aria-label="Список отчётов"]'],
    ['section=metrics&metricView=cards', '[data-metrics-results]'],
    ['section=sources&sourceReport=demo-report-debt&source=demo.finance.payments', '[aria-label="Сведения об источнике"]'],
  ];
  for (const [route, scope] of locations) {
    await page.goto(`/preview/navigation?${route}`);
    const value = page.locator(scope).getByRole('img', { name: 'Нет значения', exact: true }).first();
    await expect(value).toBeVisible();
    const style = await value.evaluate(element => {
      const line = getComputedStyle(element, '::after');
      const glyph = element.firstElementChild!;
      return {
        thickness: line.blockSize,
        color: line.backgroundColor,
        glyph: getComputedStyle(glyph).visibility,
        sameWidth: Math.abs(parseFloat(line.inlineSize) - glyph.getBoundingClientRect().width) < 0.01,
      };
    });
    expect(style).toEqual({ thickness: '1px', color: 'rgb(148, 153, 163)', glyph: 'hidden', sameWidth: true });
  }
});
