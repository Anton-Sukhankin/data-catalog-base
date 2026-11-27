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
const catalogRows: Record<string, string> = {
  'reports-table': '[data-table-report-id]',
  'favorites-table': '[data-table-report-id]',
  'metrics-table': '[data-metric-id]',
  'sources-table': 'tbody tr',
  'references-list': 'tbody tr',
  crm: 'tbody tr',
  'ai-table': 'tbody tr',
  subscriptions: '[data-subscription-row-id]',
  contribution: '[data-contributor-row-id]',
};
const catalogCards: Record<string, string> = {
  'reports-cards': '[data-card-report-id]',
  favorites: '[data-card-report-id]',
  'metrics-cards': 'article[data-metric-id]',
  'sources-cards': 'article[data-source-id]',
  'master-systems': '[data-master-system]',
  'ai-cards': 'article[data-ai-solution]',
  'references-cards': 'a[aria-label^="Открыть справочник"]',
  dictionary: '[data-dictionary-term]',
  tasks: 'ul[aria-label="Очередь заявок на рассылку"] button',
  news: 'article[data-news-id]',
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
  { name: 'dictionary-terms', query: 'section=dictionary&dictionaryTab=terms', selector: '[data-dictionary-workspace] [data-detail-tab-content]' },
  { name: 'dictionary-domains', query: 'section=dictionary&dictionaryTab=domains', selector: '[data-dictionary-workspace] [data-detail-tab-content]' },
  { name: 'tasks', query: 'section=tasks', selector: boundary },
  { name: 'questions', query: 'section=questions', selector: '[aria-label="Прокрутка вопросов и ответов"]', parent: true },
  { name: 'favorites', query: 'segment=favorites', selector: reportTable, switchToCards: true, withSummary: true },
  { name: 'favorites-table', query: 'segment=favorites', selector: reportTable, withSummary: true },
  { name: 'domains', query: 'segment=domains', selector: 'section[aria-label="Домены отчётов"]', withSummary: true },
  { name: 'subscriptions', query: 'segment=subscriptions', selector: '[data-subscriptions-content]', withSummary: true },
  { name: 'contribution', query: 'segment=contribution', selector: '[data-contribution-content]', withSummary: true },
  { name: 'news', query: 'tab=news', selector: '[aria-label="Список новостей"]' },
];
const fullyRoundedSurfaces = new Set(['dictionary', 'master-systems', 'questions', 'tasks']);

async function topBorder(target: Locator) {
  await expect(target).toBeVisible();
  return target.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.borderTopColor, width: style.borderTopWidth, type: style.borderTopStyle };
  });
}

async function expectRowBorders(rows: Locator, color: string, hoverFill?: string) {
  const row = rows.first();
  await expect(row).toBeVisible();
  const measure = () => row.evaluate(element => {
    const table = element.closest('table');
    const next = element.nextElementSibling;
    const cells = [...element.children];
    return {
      spacing: table ? getComputedStyle(table).borderSpacing : getComputedStyle(element.parentElement!).rowGap,
      gap: next ? next.getBoundingClientRect().top - element.getBoundingClientRect().bottom : null,
      cellShadows: table ? cells.map(cell => {
        const shadow = getComputedStyle(cell).boxShadow;
        return shadow === 'none' ? getComputedStyle(cell, '::before').boxShadow : shadow;
      }) : [],
      border: getComputedStyle(element, '::after').borderTop,
      groupBorder: getComputedStyle(element.parentElement!).borderTop,
      shadow: getComputedStyle(element).boxShadow,
    };
  });
  const resting = await measure();
  expect(resting.spacing).toMatch(/^(0px )?8px$/);
  if (resting.gap !== null) expect(resting.gap).toBeCloseTo(8);
  const expected = `1px solid ${color}`;
  if (resting.cellShadows.length) {
    for (const shadow of resting.cellShadows) {
      expect(shadow).toContain(`${color} 0px 1px 0px 0px inset`);
      expect(shadow).toContain(`${color} 0px -1px 0px 0px inset`);
    }
    expect(resting.cellShadows[0]).toContain(`${color} 1px 0px 0px 0px inset`);
    expect(resting.cellShadows.at(-1)).toContain(`${color} -1px 0px 0px 0px inset`);
  } else if (resting.border !== expected) {
    expect(resting.groupBorder).toBe(expected);
    if (resting.gap !== null) expect(resting.shadow).toBe(`${color} 0px -1px 0px 0px inset`);
  }
  await row.hover({ position: { x: 32, y: 20 } });
  expect(await measure()).toEqual(resting);
  if (hoverFill) {
    const fills = await row.evaluate(element => {
      if (element.closest('table')) {
        return Array.from(element.children, cell => {
          const backing = getComputedStyle(cell, '::before');
          return backing.content === 'none' ? getComputedStyle(cell).backgroundColor : backing.backgroundColor;
        });
      }
      const surfaces = element.hasAttribute('data-table-report-id')
        ? [element, element.firstElementChild!, element.lastElementChild!]
        : [element];
      return surfaces.map(surface => getComputedStyle(surface).backgroundColor);
    });
    expect(new Set(fills)).toEqual(new Set([hoverFill]));
  }
  await row.page().mouse.move(5, 5);
}

for (const theme of ['dark', 'light']) {
  test(`catalog surfaces use select borders and keep row spacing in ${theme}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(preview + 'section=questions');
    if (theme === 'light') await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
    await page.mouse.move(5, 5);
    const frame = await topBorder(page.locator('[data-collapsible="true"]').first());
    expect(frame.color).toBe(theme === 'dark' ? 'rgb(66, 69, 76)' : 'rgb(215, 230, 245)');
    expect(frame.width).toBe('1px');
    expect(frame.type).toBe('solid');
    await page.goto(preview + 'section=metrics&metricView=cards');
    const selectColor = theme === 'dark' ? 'rgb(66, 69, 76)' : 'rgb(215, 230, 245)';
    const hoverFill = theme === 'dark' ? 'rgb(50, 52, 58)' : 'rgb(249, 250, 252)';
    const select = page.getByRole('combobox', { name: 'Тип метрики' });
    await expect(select).toHaveCSS('box-shadow', `${selectColor} 0px 0px 0px 1px inset`);
    await expect(select).toHaveCSS('border-radius', '10px');
    const selectRadius = await select.evaluate(element => getComputedStyle(element).borderTopLeftRadius);
    const selectDivider = `1px solid ${selectColor}`;
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
        const workspace = page.locator('main[data-catalog-screen]');
        const surface = parent ? target.locator('..') : target;
        await expect(target).toBeVisible();
        await expect(workspace).toHaveCSS('border-style', 'none');
        await expect(workspace).toHaveCSS('border-radius', '0px');
        expect(await workspace.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none');
        if (name !== 'crm') {
          const expectedRadius = fullyRoundedSurfaces.has(name) ? selectRadius : `${selectRadius} ${selectRadius} 0px 0px`;
          await expect(surface).toHaveCSS('border-radius', expectedRadius);
          expect(await surface.evaluate(element => getComputedStyle(element, '::before').borderRadius)).toBe(expectedRadius);
        }
        if (name !== 'news' && name !== 'domains') {
          expect(await surface.evaluate(element => getComputedStyle(element, '::before').borderTop)).toBe(selectDivider);
        }
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
        if (name === 'reports-table' && theme === 'dark') {
          const filter = target.getByRole('button', { name: 'Фильтр «Отчёт»', exact: true });
          await filter.hover();
          await expect(filter.locator('..')).toHaveCSS('background-color', hoverFill);
        }
        if (catalogRows[name]) await expectRowBorders(target.locator(catalogRows[name]), selectColor, hoverFill);
        if (catalogCards[name]) {
          const item = target.locator(catalogCards[name]).first();
          await item.hover({ position: { x: 32, y: 20 } });
          await expect(item).toHaveCSS('background-color', hoverFill);
          await page.mouse.move(5, 5);
        }
        if (name === 'metrics-cards') {
          const item = target.locator('article[data-metric-id]').first();
          const footer = item.locator(':scope > :last-child');
          await expect(footer).toHaveCSS('border-top', selectDivider);
          await item.hover();
          await expect(footer).toHaveCSS('border-top', selectDivider);
        }
        if (name === 'questions') {
          const accordion = target.locator('[data-collapsible="true"]').first();
          const trigger = accordion.getByRole('button').first();
          const chevron = trigger.locator(':scope > [aria-hidden="true"]').first();
          await trigger.hover();
          await expect(accordion).toHaveCSS('border-top', selectDivider);
          await expect(trigger).toHaveCSS('background-color', hoverFill);
          await expect(chevron).toHaveCSS('background-color', theme === 'dark' ? 'rgb(69, 71, 77)' : 'rgb(229, 231, 235)');
          await expect(chevron).toHaveCSS('color', theme === 'dark' ? 'rgb(241, 242, 244)' : 'rgb(54, 56, 61)');
          await expect(trigger).toHaveAttribute('aria-expanded', 'false');
          await trigger.click();
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
          await expect(accordion.locator('[data-accordion-body]')).toHaveCSS('border-top', selectDivider);
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
        if (withSummary) {
          const heading = workspace.getByRole('heading', { level: 1 });
          const summary = workspace.getByRole('region', { name: 'Сводка каталога отчётов' });
          await expect(heading).toBeVisible();
          await expect(summary).toBeVisible();
          const workspaceBox = (await workspace.boundingBox())!;
          const headingBox = (await heading.boundingBox())!;
          const summaryBox = (await summary.boundingBox())!;
          const resultsBox = (await target.boundingBox())!;
          expect(headingBox.y).toBeGreaterThan(workspaceBox.y + 8);
          expect(summaryBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
          expect(resultsBox.y + resultsBox.height).toBeLessThanOrEqual(workspaceBox.y + workspaceBox.height + 1);
        }
        if (['reports-table', 'reports-cards', 'metrics-table', 'sources-table', 'references-list', 'ai-table', 'subscriptions', 'contribution', 'crm', 'dictionary'].includes(name)) {
          await page.screenshot({ path: info.outputPath(`catalog-frame-${name}.png`) });
          const capturedSurface = withSummary ? workspace : surface;
          await info.attach(`coordinates-${name}`, { body: JSON.stringify(await capturedSurface.boundingBox()), contentType: 'application/json' });
        }
      });
    }
    await test.step('table dividers in report and metric details', async () => {
      const report = preview + 'section=reports&report=demo-report-summary';
      await page.goto(report + '&reportTab=metrics&relatedMetricView=list');
      const linked = page.getByRole('table', { name: 'Связанные показатели', exact: true });
      await expect(linked.getByRole('columnheader').first()).toHaveCSS('box-shadow', cardRule);
      await expect(linked.locator('tbody')).toHaveCSS('border-top-width', '0px');
      await expectRowBorders(linked.locator('tbody tr'), selectColor, hoverFill);

      await page.goto(report + '&reportTab=usage');
      const history = page.getByRole('table', { name: 'История по месяцам', exact: true });
      const historyTitle = page.locator('[data-table-body]').filter({ has: history }).locator(':scope > :first-child');
      await expect(historyTitle).toHaveCSS('border-block-end', cardDivider);
      await expect(page.locator('[data-table-body] [data-accordion-body]')).toHaveCSS('border-top-width', '0px');
      const historyHeader = history.locator(header);
      expect(await historyHeader.evaluate(node => getComputedStyle(node, '::after').borderBlockEnd)).toBe(cardDivider);
      await expectRowBorders(history.getByRole('row').nth(1), selectColor);

      await page.goto(report + '&reportTab=sources');
      const attributes = page.locator('[data-report-sources] [data-accordion-body] dl').first();
      const fields = attributes.locator(':scope > div');
      await expect(fields.nth(1)).toHaveCSS('border-left', selectDivider);
      await expect(fields.nth(4)).toHaveCSS('border-top', selectDivider);

      await page.goto(preview + 'section=metrics&metric=4');
      const method = page.locator('section[data-variant="metric"]').filter({ has: page.getByRole('button', { name: /^Методика расчёта/ }) });
      await expect(method.getByRole('columnheader').first()).toHaveCSS('border-block-end', cardDivider);
    });
  });
}
