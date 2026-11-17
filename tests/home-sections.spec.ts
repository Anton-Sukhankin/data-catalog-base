import { expect, test } from '@playwright/test';

test('Home saved sources and AI solutions open details and share bookmark state with their catalogs', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview/navigation?section=home&tab=sources');
  const tabs = page.getByRole('tablist', { name: 'Тип содержимого' });
  const sourceTab = tabs.locator('[data-control-id="sources"]');
  const aiTab = tabs.locator('[data-control-id="ai-hub"]');
  const sidebar = page.getByRole('navigation', { name: 'Разделы каталога' });
  const sourceList = page.getByRole('region', { name: 'Избранные источники', exact: true });
  const source = sourceList.getByRole('button', { name: /rewedo_crm_production/ });
  const sourceBookmark = page.getByRole('button', { name: 'Закладка источника', exact: true });
  await expect(sourceTab).toHaveAccessibleName('Источники 1');
  await expect(source).toContainText('PostgreSQL · Без слоя');
  await page.screenshot({ path: info.outputPath('saved-sources.png'), animations: 'disabled' });
  const sourceCard = sourceList.locator('[data-home-favorite-id]');
  const idleBorder = await sourceCard.evaluate(element => getComputedStyle(element).borderTopColor);
  await source.hover();
  await expect.poll(() => sourceCard.evaluate(element => getComputedStyle(element).borderTopColor)).not.toBe(idleBorder);
  await source.press('Enter');
  await expect(sourceBookmark).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(source).toBeFocused();
  await source.click();
  await sourceBookmark.click();
  await page.getByRole('button', { name: 'Избранные источники', exact: true }).click();
  await expect(sourceTab).toHaveAccessibleName('Источники 0');
  await expect(sourceList.getByRole('heading')).toHaveText('В избранном пока нет источников');
  await page.screenshot({ path: info.outputPath('saved-sources-empty.png'), animations: 'disabled' });
  await sourceList.getByRole('button', { name: 'К источникам' }).click();
  await page.getByRole('button', { name: 'Дерево', exact: true }).click();
  const treeBookmark = page.getByRole('button', { name: 'Закладка rewedo_crm_production.public.versions', exact: true });
  await expect(treeBookmark).toHaveAttribute('aria-pressed', 'false');
  await treeBookmark.click();
  await sidebar.getByRole('button', { name: 'Главная', exact: true }).click();
  await sourceTab.click();
  await expect(source).toBeVisible();

  await aiTab.click();
  const aiList = page.getByRole('region', { name: 'Избранные решения AI Hub' });
  const solution = aiList.getByRole('button', { name: /fAIлик/ });
  await expect(aiTab).toHaveAccessibleName('AI Hub 2');
  await expect(solution).toContainText('Продажи и маркетинг');
  await page.screenshot({ path: info.outputPath('saved-ai.png'), animations: 'disabled' });
  await solution.click();
  const detail = page.locator('[data-ai-detail="failik"]');
  await detail.getByRole('button', { name: /^Закладка/ }).click();
  await detail.getByRole('button', { name: 'Вернуться к избранным решениям AI Hub' }).click();
  await expect(aiTab).toHaveAccessibleName('AI Hub 1');
  await expect(aiList).toBeFocused();
  await aiList.getByRole('button', { name: /^n8n/ }).click();
  await page.locator('[data-ai-detail="n8n"]').getByRole('button', { name: /^Закладка/ }).click();
  await page.getByRole('button', { name: 'Вернуться к избранным решениям AI Hub' }).click();
  await expect(aiList.getByRole('heading')).toHaveText('В избранном пока нет ИИ-решений');
  await page.screenshot({ path: info.outputPath('saved-ai-empty.png'), animations: 'disabled' });
  await aiList.getByRole('button', { name: 'В AI Hub' }).click();
  await page.getByRole('button', { name: 'Табличный вид' }).click();
  await page.locator('[data-ai-solution="failik"]').getByRole('button', { name: /^Закладка/ }).click();
  await sidebar.getByRole('button', { name: 'Главная', exact: true }).click();
  await aiTab.click();
  await expect(solution).toBeVisible();
  await expect(sourceTab).toHaveAccessibleName('Источники 1');
});

test('Home saved solutions preserve the page on return and clamp it when the last item is removed', async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/preview/navigation?section=ai&homeCase=paginated');
  for (const id of ['komblok', 's-assist', 'ragu']) {
    await page.locator(`[data-ai-solution="${id}"]`).getByRole('button', { name: /^Закладка/ }).click();
  }
  await page.getByRole('navigation', { name: 'Разделы каталога' }).getByRole('button', { name: 'Главная', exact: true }).click();
  const tabs = page.getByRole('tablist', { name: 'Тип содержимого' });
  await tabs.getByRole('tab', { name: 'AI Hub 5', exact: true }).click();
  const list = page.getByRole('region', { name: 'Избранные решения AI Hub' });
  const pages = list.getByRole('navigation', { name: 'Страницы избранных ИИ-решений' });
  await expect(list.locator('[data-home-favorite-id]')).toHaveCount(3);
  expect((await list.boundingBox())!.y - (await tabs.boundingBox())!.y - (await tabs.boundingBox())!.height).toBe(16);
  await page.screenshot({ path: info.outputPath('saved-ai-wide.png'), animations: 'disabled' });
  await pages.getByRole('button', { name: 'Следующая страница' }).click();
  const n8n = list.getByRole('button', { name: /^n8n/ });
  await n8n.click();
  await page.getByRole('button', { name: 'Вернуться к избранным решениям AI Hub' }).click();
  await expect(pages.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(n8n).toBeFocused();
  for (const id of ['n8n', 'ragu']) {
    await list.locator(`[data-home-favorite-id="${id}"]`).getByRole('button').click();
    await page.locator(`[data-ai-detail="${id}"]`).getByRole('button', { name: /^Закладка/ }).click();
    await page.getByRole('button', { name: 'Вернуться к избранным решениям AI Hub' }).click();
  }
  await expect(pages).toHaveCount(0);
  await expect(list.locator('[data-home-favorite-id]')).toHaveCount(3);
  await page.setViewportSize({ width: 900, height: 760 });
  await tabs.getByRole('tab', { name: 'Источники 1', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Избранные источники' }).getByRole('button')).toBeVisible();
  await page.screenshot({ path: info.outputPath('saved-sources-compact.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 660, height: 760 });
  const sourceTitle = page.getByRole('region', { name: 'Избранные источники' }).getByText('rewedo_crm_production.public.versions', { exact: true });
  await expect(sourceTitle).toHaveAttribute('data-overflow-clipped', 'true');
  await sourceTitle.hover();
  await expect(page.getByRole('tooltip')).toHaveText('rewedo_crm_production.public.versions');
});

test('Home Reports summary stays between the tabs and toolbar and opens details only on the domain strip', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview/navigation?section=home&paginationDemo=0');
  const tabs = page.getByRole('tablist', { name: 'Тип содержимого' });
  const summary = page.getByRole('region', { name: 'Сводка каталога отчётов' });
  const toolbar = page.locator('[data-home-controls] [data-control-toolbar]');
  const strip = summary.getByRole('img', { name: 'Распределение отчётов по доменам' });
  const details = page.locator('[data-report-domain-breakdown]');
  await expect(summary).toContainText('Всего отчётов11');
  await expect(summary).toContainText('Домены6');
  await expect(summary).toContainText('Проверенные5 из 11');
  await expect(summary).toContainText('45%');
  await expect(page.getByRole('heading', { name: 'Список отчётов' })).toHaveCount(0);
  const [tabsBox, summaryBox, toolbarBox] = await Promise.all([tabs, summary, toolbar].map(node => node.boundingBox()));
  expect(summaryBox!.y - tabsBox!.y - tabsBox!.height).toBeCloseTo(16);
  expect(toolbarBox!.y - summaryBox!.y - summaryBox!.height).toBeCloseTo(16);
  await page.screenshot({ path: info.outputPath('summary-1440.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 1920, height: 900 });
  await expect.poll(async () => (await summary.boundingBox())!.width).toBeGreaterThan(summaryBox!.width);
  await page.screenshot({ path: info.outputPath('summary-1920.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 900 });

  const stripBox = (await strip.boundingBox())!;
  await page.mouse.move(stripBox.x + 1, stripBox.y + 4);
  await expect(details).toBeVisible();
  await expect(details.locator('li')).toHaveCount(6);
  await expect(details).toContainText('Управление персоналом');
  await expect(details).toContainText('Строительство');
  expect(Number(await details.locator('strong').evaluateAll(items => items.reduce((sum, item) => sum + Number(item.textContent), 0)))).toBe(11);
  await page.screenshot({ path: info.outputPath('summary-domain-tooltip.png'), animations: 'disabled' });
  await page.mouse.move(stripBox.x + stripBox.width - 1, stripBox.y + 4);
  await expect(details).toBeVisible();
  await summary.getByText('Домены', { exact: true }).hover();
  await expect(details).toBeHidden();
  await summary.getByText('Проверенные', { exact: true }).hover();
  await expect(details).toBeHidden();
  await strip.focus();
  await expect(details).toBeVisible();
  await strip.press('Escape');
  await expect(details).toBeHidden();

  await tabs.getByRole('tab', { name: /^Источники/ }).click();
  await expect(summary).toHaveCount(0);
  await tabs.getByRole('tab', { name: /^Отчёты/ }).click();
  await expect(summary).toBeVisible();
  await page.getByRole('tab', { name: 'Домены 6', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: 'Открыть фильтры отчётов' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Гостеприимство 5 отчётов' }).click();
  await toolbar.getByRole('button', { name: 'Открыть фильтры отчётов' }).click();
  await expect(page.locator('[data-report-filter-panel]')).toBeVisible();
  await expect(summary).toContainText('Всего отчётов11');
  await page.keyboard.press('Escape');
});

test('Home Reports scrolls its summary out before the list and brings it back on reversal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 680 });
  const summary = page.getByRole('region', { name: 'Сводка каталога отчётов' });
  const tabs = page.getByRole('tablist', { name: 'Тип содержимого' });
  const toolbar = page.locator('[data-home-controls] [data-control-toolbar]');
  const clip = page.locator('[data-report-summary-clip]');

  for (const view of ['Табличный вид', 'Карточный вид']) {
    await page.goto('/preview/navigation?section=home');
    const viewButton = page.getByRole('button', { name: view });
    await viewButton.click();
    await expect(viewButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveAttribute('data-catalog-transition');
    await expect(summary).toBeVisible();
    const viewport = page.locator('[data-detail-tab-content] [data-list-scroll]');
    const readTop = () => viewport.evaluate(element => element.scrollTop);
    const readToolbar = async () => (await toolbar.boundingBox())!.y;
    const initialTabs = (await tabs.boundingBox())!.y;
    const initialToolbar = await readToolbar();
    const tabEdge = (await tabs.boundingBox())!;
    expect((await clip.boundingBox())!.y).toBeCloseTo(tabEdge.y + tabEdge.height);
    const viewportBox = (await viewport.boundingBox())!;
    await page.mouse.move(viewportBox.x + 48, viewportBox.y + 20);

    await page.mouse.wheel(0, 30);
    await expect.poll(readToolbar).toBeCloseTo(initialToolbar - 30);
    expect(await readTop()).toBe(0);
    await expect(summary).toBeVisible();

    const visibleSummary = (await clip.boundingBox())!.height;
    await page.mouse.wheel(0, 260);
    await expect(summary).toBeHidden();
    await expect.poll(readTop).toBeCloseTo(260 - visibleSummary);
    const scrolledTop = await readTop();
    const collapsedToolbar = await readToolbar();
    expect((await tabs.boundingBox())!.y).toBe(initialTabs);

    await page.mouse.wheel(0, -28);
    await expect.poll(readToolbar).toBeCloseTo(collapsedToolbar + 28);
    expect(await readTop()).toBe(scrolledTop);

    await page.mouse.wheel(0, -300);
    await expect.poll(readToolbar).toBeCloseTo(initialToolbar);
    await expect(summary).toBeVisible();
    await expect.poll(readTop).toBe(0);
    await expect(page.getByRole('navigation', { name: 'Страницы избранных отчётов' })).toBeInViewport();

    if (view === 'Табличный вид') {
      await viewport.press('ArrowDown');
      await expect.poll(readToolbar).toBeCloseTo(initialToolbar - 40);
      expect(await readTop()).toBe(0);
      await viewport.press('ArrowUp');
      await expect.poll(readToolbar).toBeCloseTo(initialToolbar);

      const card = clip.locator('dl > div').first();
      await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      const shadowOpacity = () => card.evaluate(element => Number(getComputedStyle(element, '::before').opacity));
      const sampleMotion = (deltaY: number) => viewport.evaluate(async (element, delta) => {
        const mask = document.querySelector('[data-report-summary-clip]')!;
        const card = mask.querySelector('dl > div')!;
        const readFrame = () => ({
          height: mask.getBoundingClientRect().height,
          scroll: element.scrollTop,
          shadow: Number(getComputedStyle(card, '::before').opacity),
        });
        const initial = readFrame();
        element.dispatchEvent(new WheelEvent('wheel', { deltaY: delta, bubbles: true, cancelable: true }));
        const frames = [initial, readFrame()];
        const end = performance.now() + 350;
        while (performance.now() < end) {
          await new Promise<number>(resolve => requestAnimationFrame(resolve));
          frames.push(readFrame());
        }
        return frames;
      }, deltaY);
      const closing = await sampleMotion(180);
      expect(closing[1]).toEqual(closing[0]);
      expect(closing[0].shadow).toBe(1);
      expect(closing.some(frame => frame.height > 0 && frame.height < closing[0].height && frame.scroll === 0 && frame.shadow > 0 && frame.shadow < 1)).toBe(true);
      expect(closing.findIndex(frame => frame.scroll > 0)).toBe(closing.findIndex(frame => frame.height === 0));
      await expect(summary).toBeHidden();
      expect(await shadowOpacity()).toBe(0);
      await expect.poll(readTop).toBeCloseTo(180 - closing[0].height);
      const opening = await sampleMotion(-180);
      expect(opening[1]).toEqual(opening[0]);
      expect(opening[0].shadow).toBe(0);
      expect(opening.some(frame => frame.height > 0 && frame.height < closing[0].height && frame.scroll === opening[0].scroll && frame.shadow > 0 && frame.shadow < 1)).toBe(true);
      expect(opening.findIndex(frame => frame.scroll < opening[0].scroll)).toBe(opening.findIndex(frame => frame.height === closing[0].height));
      await expect.poll(readToolbar).toBeCloseTo(initialToolbar);
      await expect.poll(readTop).toBe(0);
      expect(await shadowOpacity()).toBe(1);

      const readLeft = () => viewport.evaluate(element => element.scrollLeft);
      const readHeight = async () => (await clip.boundingBox())!.height;
      const fullHeight = await readHeight();
      await page.mouse.wheel(110, 0);
      await expect.poll(readLeft).toBe(110);
      expect(await readHeight()).toBe(fullHeight);
      await page.mouse.wheel(-35, 60);
      await expect.poll(readLeft).toBe(75);
      await expect.poll(readHeight).toBeCloseTo(fullHeight - 60);
      expect(await readTop()).toBe(0);
      await page.mouse.wheel(0, 40);
      await expect(summary).toBeHidden();
      await expect.poll(readTop).toBeCloseTo(100 - fullHeight);
    }

    if (view === 'Карточный вид') {
      const samples = await viewport.evaluate(async element => {
        const mask = document.querySelector('[data-report-summary-clip]')!;
        const readFrame = () => ({ height: mask.getBoundingClientRect().height, scroll: element.scrollTop });
        const wheel = (deltaY: number) => element.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));
        wheel(280);
        const frames = [readFrame()];
        let continued = false;
        const end = performance.now() + 700;
        while (performance.now() < end) {
          await new Promise<number>(resolve => requestAnimationFrame(resolve));
          const current = readFrame();
          frames.push(current);
          if (!continued && current.scroll > 0) {
            continued = true;
            wheel(64);
          }
        }
        return frames;
      });
      const firstMove = samples.find(frame => frame.scroll > 0);
      const final = samples.at(-1)!;
      expect(firstMove).toBeDefined();
      expect(firstMove!.height).toBe(0);
      expect(samples.indexOf(firstMove!)).toBe(samples.findIndex(frame => frame.height === 0));
      expect(final.scroll).toBeCloseTo(280 + 64 - samples[0].height);
      expect(firstMove!.scroll).toBeLessThan(final.scroll / 3);
      expect(new Set(samples.map(frame => frame.scroll)).size).toBeGreaterThan(4);
    }
  }
});

test('Home Domains lists catalog domains and opens the same reports in both views', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview/navigation?section=home&paginationDemo=0');
  const segments = page.getByRole('tablist', { name: 'Раздел отчётов' });
  const domains = segments.getByRole('tab', { name: 'Домены 6', exact: true });
  const badge = domains.locator('[data-control-count]');
  await expect(segments.getByRole('tab')).toHaveCount(4);
  expect(await segments.getByRole('tab').evaluateAll(tabs => tabs.map(tab => tab.getAttribute('data-control-id'))))
    .toEqual(['favorites', 'domains', 'subscriptions', 'contribution']);
  await expect(badge).toHaveText('6');
  await expect(badge).toHaveAttribute('data-selected', 'false');
  await domains.click();
  await expect(badge).toHaveAttribute('data-selected', 'true');
  const grid = page.getByRole('region', { name: 'Домены отчётов' });
  const card = grid.getByRole('button', { name: 'Гостеприимство 5 отчётов' });
  await expect(grid.getByRole('article')).toHaveCount(6);
  await expect(page.getByRole('group', { name: 'Вид представления' })).toHaveCount(0);
  await expect(card).toBeVisible();
  await page.screenshot({ path: info.outputPath('home-domains.png'), animations: 'disabled' });

  await card.click();
  const breadcrumb = page.getByRole('navigation', { name: 'Хлебные крошки' });
  const table = page.getByRole('table', { name: 'Список отчётов' });
  await expect(domains).toHaveAttribute('aria-selected', 'true');
  await expect(breadcrumb.getByText('Гостеприимство')).toBeVisible();
  await expect(table.locator('[data-table-report-id]')).toHaveCount(5);
  await expect(badge).toHaveText('6');
  await expect(table.getByRole('button', { name: 'Гостеприимство' })).toHaveCount(0);
  const tableIds = await table.locator('[data-table-report-id]').evaluateAll(rows => rows.map(row => row.getAttribute('data-table-report-id')));
  await page.screenshot({ path: info.outputPath('home-domain-table.png'), animations: 'disabled' });

  const cardView = page.getByRole('button', { name: 'Карточный вид' });
  await cardView.click();
  const cards = page.locator('[data-card-report-id]');
  await expect(cards).toHaveCount(5);
  expect(await cards.evaluateAll(items => items.map(item => item.getAttribute('data-card-report-id')))).toEqual(tableIds);
  await page.screenshot({ path: info.outputPath('home-domain-cards.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Открыть отчёт «Сводный отчёт Гостеприимства»' }).click();
  await expect(page).toHaveURL(/report=demo-report-summary/);
  await breadcrumb.getByRole('button', { name: 'Гостеприимство', exact: true }).click();
  await expect(cardView).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(5);
  await breadcrumb.getByRole('button', { name: 'Домены', exact: true }).click();
  await expect(card).toBeVisible();

  for (const [domainName, reportId, reportTitle] of [
    ['Строительство', 'demo-report-construction', 'Статус строительных проектов'],
    ['Управление персоналом', 'demo-report-team-workload', 'Загрузка команды'],
  ]) {
    await grid.getByRole('button', { name: `${domainName} 1 отчёт`, exact: true }).click();
    for (const [view, reportAttribute] of [['Табличный вид', 'data-table-report-id'], ['Карточный вид', 'data-card-report-id']]) {
      await page.getByRole('button', { name: view, exact: true }).click();
      const report = page.locator(`[${reportAttribute}="${reportId}"]`);
      await expect(page.locator(`[${reportAttribute}]`)).toHaveCount(1);
      await report.getByRole('button', { name: `Открыть отчёт «${reportTitle}»`, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`[?&]report=${reportId}(?:&|$)`));
      await breadcrumb.getByRole('button', { name: domainName, exact: true }).click();
      await expect(report).toBeVisible();
    }
    await breadcrumb.getByRole('button', { name: 'Домены', exact: true }).click();
  }
});

test('Home news card hover highlights the full card without opening it', async ({ page }) => {
  await page.goto('/preview/navigation?tab=news');
  const card = page.locator('[data-news-id="demo-news-1"]');
  await expect(card).toHaveCSS('border-top-color', 'rgb(215, 230, 245)');
  await card.getByRole('heading').hover();
  await expect(card).toHaveCSS('border-top-color', 'rgb(64, 143, 231)');
  await expect(card.getByRole('heading')).toHaveCSS('color', 'rgb(0, 103, 220)');
  await expect(page).not.toHaveURL(/[?&]news=/);
  await page.getByRole('tablist', { name: 'Категории новостей' }).hover();
  await expect(card).toHaveCSS('border-top-color', 'rgb(215, 230, 245)');
  await card.getByRole('button', { name: /^Читать/ }).hover();
  await expect(card).toHaveCSS('border-top-color', 'rgb(64, 143, 231)');
  await expect(card.getByRole('heading')).toHaveCSS('color', 'rgb(0, 103, 220)');
  await card.getByRole('button', { name: /^Читать/ }).click();
  await expect(page.getByRole('region', { name: 'Чтение новости', exact: true })).toHaveAttribute('data-news-reading', 'demo-news-1');
});

test('Home news shows the editorial article, opens related news and restores its originating list', async ({ page }) => {
  await page.setViewportSize({ width:1440,height:900 });
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/preview/navigation?tab=news');
  const list=page.getByRole('region',{name:'Список новостей',exact:true});
  await expect(list.locator('[data-news-id]')).toHaveCount(14);
  const tabs = page.getByRole('tablist', { name:'Тип содержимого' });
  const categories = page.getByRole('tablist', { name:'Категории новостей' });
  await expect(tabs.getByRole('tab',{name:/Новости/})).toHaveText('Новости14');
  await expect(categories.getByRole('tab',{name:/^Важное/})).toHaveText('Важное4');
  const bottom = async (locator: typeof tabs) => {
    const box = (await locator.boundingBox())!;
    return box.y + box.height;
  };
  expect((await categories.boundingBox())!.y - await bottom(tabs)).toBe(16);
  expect((await list.boundingBox())!.y - await bottom(categories)).toBe(16);
  const listScroll=page.locator('[data-news-list-scroll]');
  await listScroll.evaluate(element=>{element.scrollTop=160;});
  await expect.poll(()=>listScroll.evaluate(element=>element.scrollTop)).toBe(160);
  await list.locator('[data-news-id="demo-news-3"]').getByRole('button',{name:/^Читать/}).click();
  const reading=page.getByRole('region',{name:'Чтение новости',exact:true});
  await expect(reading).toHaveAttribute('data-news-reading','demo-news-3');
  await expect(page).toHaveURL(/news=demo-news-3/);
  expect(await reading.boundingBox()).toEqual({x:296,y:162,width:1128,height:738});
  expect((await reading.boundingBox())!.y - await bottom(tabs)).toBe(24);
  const columns = reading.locator('[data-news-columns]');
  expect(await columns.boundingBox()).toEqual({x:296,y:162,width:1128,height:738});
  const article = reading.getByRole('article');
  const neighbors = reading.getByRole('complementary', { name:'Новости текущей категории' });
  const cover = article.locator('[data-news-full-article] > img');
  const articleHeader = article.locator('header');
  const backToList = articleHeader.getByRole('button', { name:'Все новости', exact:true });
  const [articleBox, neighborsBox, coverBox] = await Promise.all([
    article.boundingBox(), neighbors.boundingBox(), cover.boundingBox(),
  ]);
  expect(neighborsBox!.width).toBe(380);
  expect(articleBox!.x).toBe(296);
  expect(articleBox!.width).toBe(730);
  expect(articleBox!.x + articleBox!.width + 18).toBe(neighborsBox!.x);
  await expect(neighbors.getByRole('heading')).toHaveCount(0);
  const firstNewsCard = (await neighbors.getByRole('button').first().boundingBox())!;
  expect(firstNewsCard.width).toBe(363);
  expect(firstNewsCard.y).toBe(neighborsBox!.y);
  expect(coverBox!.height).toBeCloseTo(730 * 315 / 620, 1);
  expect(coverBox!.y).toBeGreaterThan(await bottom(articleHeader.getByRole('paragraph')));
  await expect(page.locator('html')).not.toHaveAttribute('data-catalog-transition');
  await cover.evaluate(async image => { await (image as HTMLImageElement).decode(); await document.fonts.ready; });
  const backBox = (await backToList.boundingBox())!;
  expect([backBox.x,backBox.y,backBox.width,backBox.height]).toEqual([296,162,32,32]);
  const dateBox = (await articleHeader.locator('time').boundingBox())!;
  const statusBox = (await articleHeader.getByText('Важно', { exact:true }).boundingBox())!;
  expect(dateBox.x - backBox.x - backBox.width).toBe(8);
  expect(statusBox.x + statusBox.width).toBe(articleBox!.x + articleBox!.width);
  await expect(backToList).toHaveAttribute('data-round-action','chevron');
  await expect(backToList.locator('span')).toHaveCSS('transform','matrix(0, 1, -1, 0, 0, 0)');
  await expect(reading.getByRole('button',{name:/Предыдущая новость|Следующая новость/})).toHaveCount(0);
  await expect(reading.locator('[data-news-position]')).toHaveCount(0);
  const visibleOrder = () => neighbors.locator('[data-news-nav-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-news-nav-id')));
  const originalOrder = Array.from({length:14}, (_,i) => `demo-news-${i+1}`);
  expect(await visibleOrder()).toEqual(originalOrder);
  const active = neighbors.locator('[aria-current="page"]');
  await expect(active).toHaveAttribute('data-news-nav-id','demo-news-3');
  await expect(active).toContainText('Важно');
  await expect(active.locator('time')).toHaveAttribute('datetime','2026-10-21');
  await expect(active.locator('img')).toHaveAttribute('src','/images/news/news-image-3.png');
  const borderColor = await active.evaluate(el => getComputedStyle(el, '::after').borderTopColor);
  expect(borderColor).toBe('rgb(64, 143, 231)');
  await expect(neighbors.locator('img')).toHaveCount(14);
  await page.mouse.move(0, 0);
  await page.screenshot({path:'verification/current/news/reading.png',animations:'disabled'});
  await neighbors.locator('[data-news-nav-id="demo-news-5"]').click();
  await expect(reading).toHaveAttribute('data-news-reading','demo-news-5');
  await expect(active).toHaveAttribute('data-news-nav-id','demo-news-5');
  await expect(active.locator('img')).toHaveAttribute('src','/images/news/news-image-5.png');
  await expect(active).toHaveCount(1);
  const last = neighbors.locator('[data-news-nav-id="demo-news-14"]');
  await last.scrollIntoViewIfNeeded();
  const previousScroll = await neighbors.evaluate(element => element.scrollTop);
  expect(previousScroll).toBeGreaterThan(0);
  await last.click();
  await expect(active).toHaveAttribute('data-news-nav-id','demo-news-14');
  await expect(article.getByRole('heading',{name:'Уточнения в бизнес-словаре'})).toBeVisible();
  expect(await visibleOrder()).toEqual(originalOrder);
  expect(await neighbors.evaluate(element => element.scrollTop)).toBe(previousScroll);
  const articleFooter = article.locator('footer');
  await expect(articleFooter).toHaveCSS('border-top-width','0px');
  const footerBack = articleFooter.getByRole('button',{name:'Все новости',exact:true});
  await expect(footerBack).toHaveText('Все новости');
  await footerBack.click();
  await expect(list.locator('[data-news-id]')).toHaveCount(14);
  await expect.poll(()=>listScroll.evaluate(element=>element.scrollTop)).toBe(160);
  await page.getByRole('tablist',{name:'Категории новостей'}).getByRole('tab',{name:/^Важное/}).click();
  await expect(list.locator('[data-news-id]')).toHaveCount(4);
  const first=list.locator('[data-news-id]').first();
  const firstId=await first.getAttribute('data-news-id');
  const firstTitle=await first.locator('h3').textContent();
  await first.getByRole('button',{name:/^Читать/}).click();
  await expect(reading).toHaveAttribute('data-news-reading',firstId!);
  await expect(reading.locator('article h2')).toHaveText(firstTitle!);
  await expect(neighbors.getByRole('button')).toHaveCount(4);
  await reading.locator('[data-news-article-scroll]').evaluate(element=>{element.scrollTop=200;});
  await neighbors.getByRole('button').nth(1).press('Enter');
  await expect(reading).not.toHaveAttribute('data-news-reading',firstId!);
  await expect(neighbors.locator(`[data-news-nav-id="${firstId}"]`)).not.toHaveAttribute('aria-current');
  await expect.poll(()=>reading.locator('[data-news-article-scroll]').evaluate(element=>element.scrollTop)).toBe(0);
  await expect(article).toBeFocused();
  await page.goBack();
  await expect(list.locator('[data-news-id]')).toHaveCount(4);
  await expect(page.getByRole('tablist',{name:'Категории новостей'}).getByRole('tab',{name:/^Важное/})).toHaveAttribute('aria-selected','true');
  expect(errors).toEqual([]);
});

test('Home news shows a tooltip only when a sidebar title exceeds two lines', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 900 });
  await page.goto('/preview/navigation?tab=news&news=demo-news-3&paginationDemo=1');
  await page.evaluate(() => document.fonts.ready);
  const sidebar = page.getByRole('complementary', { name: 'Новости текущей категории' });
  const clipped = sidebar.locator('[data-news-nav-id="demo-news-11"] [data-overflow-text]');
  await expect(clipped).toHaveAttribute('data-overflow-clipped', 'true');
  await expect(clipped).toHaveCSS('height', '40px');
  const fullTitle = (await clipped.textContent())!;
  await clipped.hover();
  await expect(page.getByRole('tooltip')).toHaveText(fullTitle);

  const titles = sidebar.locator('[data-overflow-text]');
  const twoLineIndex = await titles.evaluateAll(elements => elements.findIndex(element =>
    element.clientHeight === 40 && !element.hasAttribute('data-overflow-clipped')));
  expect(twoLineIndex).toBeGreaterThanOrEqual(0);
  await titles.nth(twoLineIndex).hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(titles.nth(twoLineIndex)).not.toHaveAttribute('data-overflow-clipped', 'true');
});

test('subscription domain headers toggle independently and keep their state across views', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/navigation?segment=subscriptions&paginationDemo=0');
  const groups = page.locator('[data-subscription-domain]');
  const first = groups.first();
  const toggle = first.locator('button[aria-expanded]');
  const chevron = toggle.locator('[data-group-chevron]');
  const contentId = await toggle.getAttribute('aria-controls');
  const content = first.locator(`[id="${contentId}"]`);
  const badge = toggle.locator('span').nth(1);
  const count = await badge.innerText();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(chevron).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
  await expect(content.locator('[data-subscription-row-id]').first()).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(chevron).toHaveCSS('transform', 'none');
  await expect(badge).toHaveText(count);
  await expect(badge).toHaveCSS('background-color', 'rgb(0, 123, 252)');
  await expect(content).toHaveAttribute('inert', '');
  await expect(content).toBeHidden();
  await expect(groups.nth(1).locator('[data-subscription-row-id]').first()).toBeVisible();

  await page.getByRole('button', { name: 'Карточный вид', exact: true }).click();
  await expect(content).toBeHidden();
  await expect(groups.nth(1).locator('[data-subscription-id]').first()).toBeVisible();
  await toggle.press('Enter');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(content.locator('[data-subscription-id]').first()).toBeVisible();
});

test('subscriptions and contribution switch the same objects and route distinct report links', async ({ page }, testInfo)=>{
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/navigation?segment=subscriptions&paginationDemo=0');
  await expect(page.getByRole('button',{name:'Табличный вид',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Карточный вид',exact:true}).click();
  const subscriptions=page.locator('[data-subscriptions-content]');
  await expect(subscriptions.locator('[data-subscription-id]')).toHaveCount(10);
  const cardIds=await subscriptions.locator('[data-subscription-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-subscription-id')));
  await page.screenshot({path:'verification/current/home/subscriptions-cards.png'});
  await page.getByRole('button',{name:'Табличный вид',exact:true}).click();
  await expect(subscriptions.locator('[data-subscription-row-id]')).toHaveCount(cardIds.length);
  expect(await subscriptions.locator('[data-subscription-row-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-subscription-row-id')))).toEqual(cardIds);
  const debt=subscriptions.getByRole('button',{name:'Отчёт по дебиторской задолженности',exact:true});
  await debt.click();
  await expect(page.locator('[data-report-id]')).toHaveAttribute('data-report-id','demo-report-debt');
  await page.getByRole('navigation',{name:'Хлебные крошки',exact:true}).getByRole('button',{name:'Отчёты',exact:true}).click();
  await expect(subscriptions).toHaveAttribute('data-view','list');
  await subscriptions.getByRole('button',{name:'Профайл МОП',exact:true}).first().click();
  await expect(page.locator('[data-report-id]')).toHaveAttribute('data-report-id','demo-report-mop-profile');
  await expect(page.getByRole('heading',{name:'Профайл МОП',exact:true})).toBeVisible();
  await page.goBack();
  await subscriptions.getByRole('button',{name:/^Отписаться от/}).first().click();
  await expect(page.getByRole('status')).toContainText('Отписка не выполнена');
  await expect(subscriptions.locator('[data-subscription-row-id]')).toHaveCount(10);
  await page.getByRole('tablist',{name:'Раздел отчётов'}).getByRole('tab',{name:'Вклад в каталог 9',exact:true}).click();
  await expect(page.getByRole('button',{name:'Табличный вид',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Карточный вид',exact:true}).click();
  const contribution=page.locator('[data-contribution-content]');
  const cards = contribution.locator('[data-contributor-id]');
  await expect(cards).toHaveCount(9);
  await expect(cards.first()).toHaveCSS('border-radius','12px');
  const firstCard = (await cards.first().boundingBox())!;
  expect((await cards.nth(1).boundingBox())!.y - firstCard.y - firstCard.height).toBe(8);
  const people=await cards.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-contributor-id')));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:testInfo.outputPath('home-contribution-cards.png'),animations:'disabled'});
  await cards.last().scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('home-contribution-cards-end.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Табличный вид',exact:true}).click();
  const rows = contribution.locator('[data-contributor-row-id]');
  await expect(rows).toHaveCount(people.length);
  expect(await rows.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-contributor-row-id')))).toEqual(people);
  const cells = await contribution.getByRole('cell').allTextContents();
  expect(cells).toHaveLength(72);
  expect(cells.every(value => value.trim() !== '' && value.trim() !== '—')).toBe(true);
  const descriptions = rows.locator('[data-overflow-text]');
  await expect(descriptions).toHaveCount(9);
  for (const description of await descriptions.all()) await expect(description).toHaveCSS('color','rgb(82, 105, 140)');
  await expect(descriptions.first()).toHaveText('Дирекция развития ИИ-платформы продукта и продаж');
  await page.screenshot({path:testInfo.outputPath('home-contribution-table.png'),animations:'disabled'});
});

test('Home empty states and pagination remain accessible in both views',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  for(const [name,section] of [['subscriptions','subscriptions'],['contribution','contribution'],['favorites','favorites']] as const){
    await page.goto(`/preview/navigation?segment=${section}&homeCase=empty-${name}`);
    const text=name==='subscriptions'?'Вы пока ни на что не подписаны':name==='contribution'?'Вклад в каталог пока не отображается':'В избранном пока нет отчётов';
    await expect(page.getByRole('heading',{name:text,exact:true})).toBeVisible();
    const surface=name==='favorites'?page.getByRole('region',{name:'Пустое избранное'}):page.locator(name==='subscriptions'?'[data-subscriptions-content]':'[data-contribution-content]');
    const summary = page.getByRole('region', { name: 'Сводка каталога отчётов' });
    await expect(summary).toBeVisible();
    const { height: summaryHeight } = (await summary.boundingBox())!;
    const summarySpace = summaryHeight + 16;
    expect(await surface.boundingBox()).toEqual({x:296,y:210+summarySpace,width:1128,height:(name==='subscriptions'?690:674)-summarySpace});
    await expect(surface).toHaveCSS('border-bottom-right-radius','16px');
    await page.screenshot({path:`verification/current/home/empty-${name}.png`});
    await expect(page.getByRole('navigation',{name:/^Страницы/})).toHaveCount(0);
  }
  await page.goto('/preview/navigation?tab=news&homeCase=empty-news');
  await expect(page.getByRole('heading',{name:'Новостей пока нет',exact:true})).toBeVisible();
  const emptyNews=page.getByRole('region',{name:'Список новостей',exact:true});
  expect(await emptyNews.boundingBox()).toEqual({x:296,y:154,width:1128,height:746});
  await expect(emptyNews).toHaveCSS('border-bottom-right-radius','16px');
  await page.screenshot({path:'verification/current/news/empty.png'});
  await expect(page.getByRole('tablist',{name:'Категории новостей'})).toHaveCount(0);
  await page.goto('/previews/contributors.html?view=cards&case=empty');
  expect((await page.locator('[data-contribution-content]').boundingBox())?.height).toBe(674);
  await expect(page.locator('[data-contribution-content]')).toHaveCSS('border-bottom-right-radius','16px');
  await page.goto('/preview/navigation?segment=contribution&homeCase=paginated');
  await page.getByRole('button',{name:'Карточный вид',exact:true}).click();
  const people=page.locator('[data-contribution-content]');
  await expect(people.locator('[data-contributor-id]')).toHaveCount(3);
  await page.getByRole('navigation',{name:'Страницы вклада в каталог'}).getByRole('button',{name:'Следующая страница'}).click();
  const ids=await people.locator('[data-contributor-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-contributor-id')));
  expect(ids).toEqual(['demo-contributor-4','demo-contributor-5','demo-contributor-6']);
  await page.getByRole('button',{name:'Табличный вид',exact:true}).click();
  await expect(people.locator('[data-contributor-row-id]')).toHaveCount(ids.length);
  expect(await people.locator('[data-contributor-row-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-contributor-row-id')))).toEqual(ids);
  await page.getByRole('navigation',{name:'Страницы вклада в каталог'}).getByRole('button',{name:'Следующая страница'}).click();
  await expect(people.locator('[data-contributor-row-id]').last()).toHaveAttribute('data-contributor-row-id','demo-contributor-9');
});
