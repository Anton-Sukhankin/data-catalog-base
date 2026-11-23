import { expect, test, type Locator } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const boundary = '[data-list-scroll-boundary]';
const reportTable = '[data-report-summary-results] ' + boundary;
const catalogResults = '[data-catalog-view-results]';
const preview = '/preview/navigation?';
const header = '[role="rowgroup"]:has([role="columnheader"])';
const borderDividers: Record<string, string> = {
  'reports-table': reportTable + ' ' + header,
  'favorites-table': reportTable + ' ' + header,
  'metrics-table': '[data-metrics-results]',
  subscriptions: '[data-subscriptions-content] ' + header,
  contribution: '[data-contribution-content] ' + header,
};

const surfaces = [
  { name: 'reports-table', query: 'section=reports', selector: reportTable, withSummary: true },
  { name: 'reports-cards', query: 'section=reports', selector: reportTable, switchToCards: true, withSummary: true },
  { name: 'metrics-table', query: 'section=metrics&metricView=list', selector: '[data-metrics-results]' },
  { name: 'metrics-cards', query: 'section=metrics&metricView=cards', selector: '[data-metrics-results]' },
  { name: 'sources-table', query: 'section=sources&sourceView=list', selector: catalogResults + boundary },
  { name: 'sources-cards', query: 'section=sources&sourceView=cards', selector: catalogResults + boundary },
  { name: 'sources-tree', query: 'section=sources&sourceView=tree', selector: catalogResults + boundary },
  { name: 'master-systems', query: 'section=sources&sourceSection=master', selector: '[data-master-systems]' },
  { name: 'references-cards', query: 'section=systems', selector: catalogResults + '[data-view="cards"]' },
  { name: 'references-list', query: 'section=systems&systems.view=list', selector: catalogResults + '[data-view="list"]' },
  { name: 'crm', query: 'section=systems&systems.reference=crm', selector: '[aria-label="Таблица метаданных CRM"]', parent: true },
  { name: 'ai-table', query: 'section=ai&ai.view=list', selector: catalogResults + boundary },
  { name: 'ai-cards', query: 'section=ai&ai.view=cards', selector: '[data-ai-grid]' },
  { name: 'dictionary', query: 'section=dictionary', selector: '[data-dictionary-workspace] [data-detail-tab-content]' },
  { name: 'dictionary-processes', query: 'section=dictionary&dictionaryTab=processes', selector: '[data-dictionary-workspace] [data-detail-tab-content]' },
  { name: 'tasks', query: 'section=tasks', selector: boundary },
  { name: 'questions', query: 'section=questions', selector: '[aria-label="Прокрутка вопросов и ответов"]', parent: true },
  { name: 'favorites', query: 'segment=favorites', selector: reportTable, switchToCards: true, withSummary: true },
  { name: 'favorites-table', query: 'segment=favorites', selector: reportTable, withSummary: true },
  { name: 'domains', query: 'segment=domains', selector: 'section[aria-label="Домены отчётов"]', withSummary: true },
  { name: 'subscriptions', query: 'segment=subscriptions', selector: '[data-subscriptions-content]', withSummary: true },
  { name: 'contribution', query: 'segment=contribution', selector: '[data-contribution-content]', withSummary: true },
  { name: 'news', query: 'tab=news', selector: '[aria-label="Список новостей"]' },
];

async function topBorder(target: Locator) {
  await expect(target).toBeVisible();
  return target.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.borderTopColor, width: style.borderTopWidth, type: style.borderTopStyle };
  });
}

for (const theme of ['dark', 'light']) {
  test(`catalog surfaces omit outer borders and keep internal dividers in ${theme}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(preview + 'section=questions');
    if (theme === 'light') await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
    await page.mouse.move(5, 5);
    const frame = await topBorder(page.locator('[data-collapsible="true"]').first());
    expect(frame.color).toBe(theme === 'dark' ? 'rgb(66, 69, 76)' : 'rgb(214, 230, 251)');
    expect(frame.width).toBe('1px');
    expect(frame.type).toBe('solid');
    await page.goto(preview + 'section=reports');
    await page.getByRole('button', { name: 'Карточный вид', exact: true }).click();
    await page.mouse.move(5, 5);
    const card = await topBorder(page.locator('[data-card-report-id]').first());
    const cardDivider = `${card.width} ${card.type} ${card.color}`;
    const cardRule = `${card.color} 0px -${card.width} 0px 0px inset`;

    for (const { name, query, selector, parent, switchToCards, withSummary } of surfaces) {
      await test.step(name, async () => {
        await page.goto(preview + query);
        if (switchToCards) {
          const view = page.getByRole('button', { name: 'Карточный вид', exact: true });
          if (await view.getAttribute('aria-pressed') !== 'true') await view.click();
          await page.mouse.move(5, 5);
        }
        const target = page.locator(selector);
        const surface = withSummary ? page.locator('main[data-catalog-screen]') : parent ? target.locator('..') : target;
        await expect(target).toBeVisible();
        expect(await surface.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none');
        await expect(surface).toHaveCSS('border-style', 'none');
        if (borderDividers[name]) {
          const divider = page.locator(borderDividers[name]);
          expect(await divider.evaluate(element => getComputedStyle(element, '::after').borderBlockEnd))
            .toBe(cardDivider);
        }
        if (name === 'sources-table' || name === 'ai-table') {
          const line = name === 'sources-table'
            ? target.locator('[data-source-table-scrolled]')
            : target;
          const pseudo = name === 'sources-table' ? '::before' : '::after';
          expect(await line.evaluate((element, pseudo) => {
            const style = getComputedStyle(element, pseudo);
            return { color: style.backgroundColor, width: style.height };
          }, pseudo)).toEqual({ color: card.color, width: card.width });
        }
        if (name === 'references-list' || name === 'crm') {
          const columnHeader = target.getByRole('columnheader').first();
          await expect(columnHeader).toHaveCSS('box-shadow', cardRule);
          if (name === 'crm') {
            const resultBar = page.getByRole('status').filter({ hasText: /записей|запись/ }).locator('..');
            await expect(resultBar).toHaveCSS('border-block-end', cardDivider);
            await page.getByRole('button', { name: 'Скрыть поиск', exact: true }).click();
            await target.evaluate(element => { element.scrollTop = 40; });
            await expect(columnHeader).toHaveCSS('box-shadow', cardRule);
          } else {
            await expect(target.locator('header')).toHaveCSS('border-block-end', cardDivider);
          }
        }
        if (name === 'subscriptions' || name === 'contribution') {
          const rows = ':is([data-subscription-row-id], [data-contributor-row-id])';
          const list = target.locator(`div:has(> ${rows})`).first();
          await expect(list).toHaveCSS('border-style', 'none');
          await expect(list.locator(`:scope > ${rows}:not(:last-child)`).first()).toHaveCSS('border-bottom-width', '1px');
        }
        if (withSummary) {
          const heading = surface.getByRole('heading', { level: 1 });
          const summary = surface.getByRole('region', { name: 'Сводка каталога отчётов' });
          await expect(heading).toBeVisible();
          await expect(summary).toBeVisible();
          const workspace = (await surface.boundingBox())!;
          const headingBox = (await heading.boundingBox())!;
          const summaryBox = (await summary.boundingBox())!;
          const resultsBox = (await target.boundingBox())!;
          expect(headingBox.y).toBeGreaterThan(workspace.y + 8);
          expect(summaryBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
          expect(resultsBox.y + resultsBox.height).toBeLessThanOrEqual(workspace.y + workspace.height + 1);
          expect(await target.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none');
        }
        if (['reports-table', 'reports-cards', 'metrics-table', 'sources-table', 'references-list', 'ai-table', 'subscriptions', 'contribution', 'crm'].includes(name)) {
          await page.screenshot({ path: info.outputPath(`catalog-frame-${name}.png`) });
          await info.attach(`coordinates-${name}`, { body: JSON.stringify(await surface.boundingBox()), contentType: 'application/json' });
        }
      });
    }
    await test.step('table dividers in report and metric details', async () => {
      const report = preview + 'section=reports&report=demo-report-summary';
      await page.goto(report + '&reportTab=metrics&relatedMetricView=list');
      const linked = page.getByRole('table', { name: 'Связанные показатели', exact: true });
      await expect(linked.getByRole('columnheader').first()).toHaveCSS('box-shadow', cardRule);
      await expect(linked.locator('tbody')).toHaveCSS('border-top-width', '0px');

      await page.goto(report + '&reportTab=usage');
      const history = page.getByRole('table', { name: 'История по месяцам', exact: true });
      const historyTitle = page.locator('[data-table-body]').filter({ has: history }).locator(':scope > :first-child');
      await expect(historyTitle).toHaveCSS('border-block-end', cardDivider);
      await expect(page.locator('[data-table-body] [data-accordion-body]')).toHaveCSS('border-top-width', '0px');
      const historyHeader = history.locator(header);
      expect(await historyHeader.evaluate(node => getComputedStyle(node, '::after').borderBlockEnd)).toBe(cardDivider);

      await page.goto(preview + 'section=metrics&metric=4');
      const method = page.locator('section[data-variant="metric"]').filter({ has: page.getByRole('button', { name: /^Методика расчёта/ }) });
      await expect(method.getByRole('columnheader').first()).toHaveCSS('border-block-end', cardDivider);
    });
  });
}
