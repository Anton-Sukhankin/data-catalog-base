import { expect, test } from '@playwright/test';

const home = '/preview/navigation?section=home';
const reports = '/preview/navigation?section=reports';
test.use({ storageState: { cookies: [], origins: [] } });

test('dark is the default and an explicit light choice survives direct links and reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const toggle = page.getByRole('button', { name: 'Тёмная тема', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Разделы каталога' });
  for (const [section, label] of [
    ['home', 'Главная'],
    ['reports', 'Отчёты'],
    ['tasks', 'Задачи'],
    ['metrics', 'Метрики и показатели'],
    ['sources', 'Источники'],
    ['dictionary', 'Бизнес-словарь'],
    ['ai', 'AI Hub'],
    ['systems', 'Справочники ИС'],
    ['questions', 'Вопросы и ответы'],
  ]) {
    await page.goto(section === 'home' ? '/preview/navigation' : '/preview/navigation?section=' + section);
    await expect(navigation.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(23, 24, 27)');
  }
  await toggle.press('Space');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await page.goto(reports);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await page.evaluate(() => localStorage.setItem('data-catalog.theme', 'invalid'));
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
});

test('switching the theme preserves catalog filters, location and assistant draft', async ({ page }) => {
  await page.goto(reports);
  await page.getByRole('button', { name: 'Фильтр «Домен»', exact: true }).click();
  const filter = page.getByRole('dialog', { name: 'Фильтр: Домен' });
  await filter.getByRole('checkbox', { name: 'Гостеприимство', exact: true }).check();
  await filter.getByRole('button', { name: 'Применить' }).click();
  const heading = page.getByRole('button', { name: 'Фильтр «Домен»', exact: true });
  await expect(heading).toBeVisible();

  await page.getByRole('button', { name: 'Открыть AI-ассистента' }).click();
  await page.getByRole('button', { name: 'Новая беседа' }).click();
  const draft = page.getByRole('textbox', { name: 'Сообщение' });
  await draft.fill('Черновик проверки темы');
  const before = page.url();
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page).toHaveURL(before);
  await expect(draft).toHaveValue('Черновик проверки темы');
  await page.getByRole('button', { name: 'Закрыть AI-ассистента' }).click();
  await heading.click();
  await expect(filter.getByRole('checkbox', { name: 'Гостеприимство', exact: true })).toBeChecked();
});

test('menu portal and native question dialog share the dark palette', async ({ page }) => {
  await page.goto('/preview/navigation?section=questions');
  const profile = page.getByRole('button', { name: 'Профиль пользователя' });
  await profile.press('Enter');
  await expect(page.getByRole('menu', { name: 'Профиль пользователя' })).toHaveCSS('background-color', 'rgb(41, 43, 48)');
  await page.keyboard.press('Escape');
  await expect(profile).toBeFocused();

  const ask = page.getByRole('button', { name: 'Задать вопрос' });
  await ask.click();
  const surface = page.locator('[data-question-surface]');
  await expect(surface).toHaveCSS('background-color', 'rgb(41, 43, 48)');
  await expect(page.locator('[data-question-backdrop]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.58)');
  await page.getByRole('button', { name: 'Отправить вопрос' }).click();
  await expect(page.getByRole('textbox', { name: 'Тема' })).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Escape');
  await expect(ask).toBeFocused();
});

test('theme can change when local preferences cannot be read or written', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Unavailable', 'SecurityError'); } });
  });
  await page.goto(home);
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});


test('first paint uses the default or saved theme and open tabs stay synchronized', async ({ page, context }) => {
  const entryRequest = /\/(?:assets\/main-[^/]+\.js|src\/main\.tsx)(?:\?.*)?$/;
  const checkBeforeReact = async (tab: typeof page, url: string, theme: 'dark' | 'light') => {
    let resume!: () => void;
    const heldEntry = new Promise<void>(resolve => { resume = resolve; });
    await tab.route(entryRequest, async route => {
      await heldEntry;
      await route.continue();
    }, { times: 1 });
    try {
      const entry = tab.waitForRequest(entryRequest);
      await tab.goto(url, { waitUntil: 'commit' });
      await entry;
      await expect(tab.locator('html')).toHaveAttribute('data-catalog-theme', theme);
      await expect(tab.locator('html')).toHaveCSS('color-scheme', theme);
      await expect(tab.getByRole('button', { name: 'Тёмная тема' })).toHaveCount(0);
    } finally {
      resume();
    }
  };

  await checkBeforeReact(page, home, 'dark');
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });
  await toggle.click();
  const other = await context.newPage();
  await checkBeforeReact(other, '/preview/navigation?section=questions', 'light');

  await other.getByRole('button', { name: 'Задать вопрос' }).click();
  const subject = other.getByRole('textbox', { name: 'Тема' });
  await subject.fill('Черновик вопроса');
  await toggle.click();
  await expect(other.locator('[data-question-surface]')).toHaveCSS('background-color', 'rgb(41, 43, 48)');
  await toggle.click();
  await expect(other.locator('html')).toHaveCSS('color-scheme', 'light');
  await page.evaluate(() => localStorage.clear());
  await expect(other.locator('html')).toHaveCSS('color-scheme', 'dark');
  await expect(subject).toHaveValue('Черновик вопроса');
  await expect(subject).toBeFocused();
});

test('dark theme works with the Navigator and sidebar at desktop and narrow widths', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });
  for (const width of [1440, 1024, 720]) {
    await page.setViewportSize({ width, height: 900 });
    const activeSection = page.locator('[aria-current="page"]').getByText('Главная', { exact: true });
    await expect(activeSection).toBeVisible();
    await expect(page.locator('[aria-current="page"]').filter({ has: page.getByText('Главная', { exact: true }) })).toHaveCSS('background-color', 'rgb(55, 58, 64)');
    const search = page.getByRole('combobox', { name: 'Поиск по каталогу' });
    const field = await search.boundingBox();
    const theme = await toggle.boundingBox();
    expect(field!.x + field!.width).toBeLessThan(theme!.x);
    await search.fill('');
    await search.fill('Сводный отчёт Гостеприимства');
    const navigator = page.getByRole('dialog', { name: 'Поиск по каталогу' });
    await expect(navigator).toContainText('Сводный отчёт Гостеприимства');
    if (width === 1440) await page.screenshot({ path: info.outputPath('dark-navigator.png'), animations: 'disabled' });
    await search.press('Escape');
    await expect(navigator).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Свернуть панель' }).click();
  await expect(page.getByRole('button', { name: 'Развернуть панель' })).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Развернуть панель' })).toBeVisible();
});

test('dark charts retain monthly values, focus and the fullscreen source graph', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const entry = reports + '&report=demo-report-summary&reportTab=usage';
  await page.goto(entry);
  await page.getByRole('button', { name: 'Тёмная тема' }).click();
  const chart = page.locator('[data-usage-chart="mau"]');
  await chart.locator('[data-usage-month="2026-01"]').hover();
  const tooltip = chart.getByRole('tooltip');
  await expect(tooltip.locator('strong')).toHaveText('66');
  await chart.screenshot({ path: info.outputPath('light-usage-chart.png') });
  await page.getByRole('button', { name: 'Тёмная тема' }).click();
  await chart.locator('[data-usage-month="2026-01"]').hover();
  await expect(tooltip).toHaveCSS('background-color', 'rgb(41, 43, 48)');
  await expect(chart.locator('[data-usage-guide]')).toHaveCSS('stroke', 'rgb(134, 184, 255)');
  await chart.screenshot({ path: info.outputPath('dark-usage-chart.png') });
  await chart.getByRole('img').press('ArrowRight');
  await expect(tooltip.locator('strong')).toHaveText('110');

  await page.goto('/preview/navigation?section=sources&source=source-reportcrm-date&sourceTab=lineage');
  const graph = page.getByRole('group', { name: 'Граф происхождения данных', exact: true });
  await expect(graph.getByRole('list', { name: 'Категории происхождения данных' })).toBeVisible();
  const zoom = graph.getByRole('button', { name: 'Увеличить граф' });
  const fullscreen = graph.getByRole('button', { name: 'Граф на полный экран' });
  await zoom.click();
  await fullscreen.click();
  const exit = graph.getByRole('button', { name: 'Выйти из полного экрана' });
  await expect(exit).toBeFocused();
  await expect(graph).toHaveCSS('background-color', 'rgb(32, 33, 37)');
  await page.screenshot({ path: info.outputPath('dark-source-lineage-fullscreen.png'), animations: 'disabled' });
  await exit.click();
  await expect(fullscreen).toBeFocused();
  await expect(page.getByRole('complementary', { name: 'Сведения об источнике' })).toBeVisible();
});



test('report workspaces keep summary, rows and pinned actions distinct in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(reports);
  const summary = page.getByRole('region', { name: 'Сводка каталога отчётов' });
  const cards = summary.locator('dl > div');
  const table = page.getByRole('region', { name: 'Таблица отчётов', exact: true });
  const body = table.getByLabel('Прокрутка таблицы отчётов', { exact: true });
  const row = body.locator('[data-table-report-id]:not([inert] *)').first();
  const actions = row.locator(':scope > :last-child');
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });

  await toggle.click();
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(table).toHaveCSS('background-color', 'rgb(243, 244, 249)');
  await toggle.click();

  for (const location of [reports, home]) {
    if (location === home) await page.goto(home);
    await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(23, 24, 27)');
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('background-color', 'rgb(38, 39, 43)');
      await expect(card).toHaveCSS('box-shadow', /rgb\(89, 92, 101\).*inset/);
    }
    await expect(table).toHaveCSS('background-color', 'rgb(38, 39, 43)');
    await expect(row).toHaveCSS('background-color', 'rgb(32, 33, 37)');
    await expect(actions).toHaveCSS('background-color', 'rgb(32, 33, 37)');
  }

  await page.setViewportSize({ width: 1024, height: 900 });
  for (const name of ['Свернуть панель', 'Развернуть панель']) {
    await body.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await expect(table).toHaveAttribute('data-table-scrolled', 'true');
    await page.getByRole('button', { name, exact: true }).click();
    await expect.poll(async () => {
      const boundary = await body.boundingBox();
      const pinned = await actions.boundingBox();
      return Math.abs(boundary!.x + boundary!.width - pinned!.x - pinned!.width);
    }).toBeLessThan(0.1);
  }
  const gap = await row.locator('[data-mau-trend]').first().evaluate((element) => getComputedStyle(element).columnGap);
  expect(gap).toBe('8px');
});

test('the common empty illustration blends into the selected theme', async ({ page }) => {
  await page.goto('/preview/navigation?section=questions&questions.tab=mine&questionsCase=empty');
  const artwork = page.getByRole('heading', { name: 'У вас пока нет обращений' }).locator('..').locator('img');
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveCSS('mix-blend-mode', 'screen');
  await page.getByRole('button', { name: 'Тёмная тема' }).click();
  await expect(artwork).toHaveCSS('mix-blend-mode', 'multiply');
});



test('entity icons share the report palette in both themes and verification follows the theme', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  const row = page.locator('[data-table-report-id="demo-report-summary"]');
  const card = page.locator('[data-card-report-id="demo-report-summary"]');
  const toggle = page.getByRole('button', { name: 'Тёмная тема' });
  const icon = '[data-catalog-entity-icon="report"]';
  const overlay = card.getByRole('img', { name: 'Проверенный отчёт' });
  const check = overlay.locator('path');
  const selectView = (name: string) => page.getByRole('button', { name, exact: true }).click();

  await page.goto(reports);
  await toggle.click();
  await expect(row.locator(icon)).toHaveCSS('background-color', 'rgb(238, 242, 246)');
  await selectView('Карточный вид');
  await expect(card.locator(icon)).toHaveCSS('background-color', 'rgb(238, 242, 246)');
  await expect(check).toHaveCSS('stroke', 'rgb(255, 255, 255)');
  await card.screenshot({ path: info.outputPath('light-report-card.png') });

  await toggle.click();
  await expect(card.locator(icon)).toHaveCSS('background-color', 'rgb(58, 58, 62)');
  await expect(card.locator(icon)).toHaveCSS('color', 'rgb(178, 181, 189)');
  expect(await card.locator(icon).evaluate(element => getComputedStyle(element, '::before').maskImage)).toContain('data:image/svg+xml');
  await expect(check).toHaveCSS('stroke', 'rgb(131, 215, 174)');
  await expect(overlay.locator('circle').first()).toHaveCSS('fill', 'rgb(34, 58, 50)');
  await expect(overlay.locator('circle').first()).toHaveCSS('stroke', 'rgb(32, 33, 37)');
  await expect(page.locator('[data-card-report-id="demo-report-occupancy"] [data-verification-mark]')).toHaveCount(0);
  await card.screenshot({ path: info.outputPath('dark-report-card.png') });
  await card.hover();
  await expect(card.locator(icon)).toHaveCSS('background-color', 'rgb(37, 54, 76)');
  await expect(card.locator(icon)).toHaveCSS('color', 'rgb(134, 184, 255)');
  await card.screenshot({ path: info.outputPath('dark-report-card-hover.png') });
  await selectView('Табличный вид');
  await expect(row.locator(icon)).toHaveCSS('background-color', 'rgb(58, 58, 62)');
  await expect(row.getByRole('img', { name: 'Проверен' }).locator('path')).toHaveCSS('stroke', 'rgb(131, 215, 174)');
  await row.screenshot({ path: info.outputPath('dark-report-row.png') });

  const otherScreens = [
    ['section=home&segment=subscriptions', '[data-catalog-entity-icon="report"]'],
    ['section=home&segment=domains', '[data-catalog-entity-icon="domain"]'],
    ['section=sources', '[data-catalog-entity-icon="source"]'],
    ['section=sources&source=source-reportcrm-date&sourceTab=similar', '[data-catalog-entity-icon="source"]'],
    ['section=sources&source=source-reportcrm-date&sourceTab=reports', icon],
    ['section=sources&source=source-reportcrm-date&sourceTab=metrics', '[data-catalog-entity-icon="metric"]'],
    ['section=metrics', '[data-catalog-entity-icon="metric"]'],
    ['section=metrics&metricView=cards', '[data-catalog-entity-icon="indicator"]'],
    ['section=tasks', '[data-catalog-entity-icon="task"]'],
    ['section=ai&ai.view=list', '[data-catalog-entity-icon="ai"]'],
    ['section=systems', '[data-catalog-entity-icon="reference"]'],
  ];
  for (const [query, selector] of otherScreens) {
    await page.goto('/preview/navigation?' + query);
    await page.mouse.move(0, 0);
    await expect(page.locator(selector).first(), query).toHaveCSS('background-color', 'rgb(58, 58, 62)');
    await expect(page.locator(selector).first(), query).toHaveCSS('color', 'rgb(178, 181, 189)');
  }

  for (const query of ['section=metrics&metric=4', 'section=reports&report=demo-report-summary']) {
    await page.goto('/preview/navigation?' + query);
    const mark = page.locator('[data-verification-mark="inline"]');
    await expect(mark.locator('path')).toHaveCSS('stroke', 'rgb(131, 215, 174)');
  }
});



test('collapsed navigation uses expanded hover and selected colors in the dark theme', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(home);
  const sidebar = page.locator('aside[data-collapsed]');
  const nav = sidebar.getByRole('navigation', { name: 'Разделы каталога' });
  const active = nav.getByRole('button', { name: 'Главная', exact: true });
  const inactive = nav.getByRole('button', { name: 'Отчёты', exact: true });
  const itemColor = (button: typeof active, pseudo?: string) =>
    button.evaluate((element, pseudo) => getComputedStyle(element, pseudo).backgroundColor, pseudo);

  await expect(active).toHaveCSS('background-color', 'rgb(55, 58, 64)');
  await expect(inactive).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const selected = await itemColor(active);
  await inactive.hover();
  const hover = await itemColor(inactive);
  expect(hover).not.toBe('rgba(0, 0, 0, 0)');
  await sidebar.screenshot({ path: info.outputPath('sidebar-dark-expanded-hover.png') });

  await sidebar.getByRole('button', { name: 'Свернуть панель', exact: true }).click();
  await page.mouse.move(700, 500);
  await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  await expect.poll(() => itemColor(active, '::before')).toBe(selected);
  await expect.poll(() => itemColor(inactive, '::before')).toBe(hover);
  await sidebar.screenshot({ path: info.outputPath('sidebar-dark-collapsed.png') });
  await inactive.hover();
  await expect.poll(() => itemColor(inactive, '::before')).toBe(hover);
  await inactive.click();
  await page.mouse.move(700, 500);
  await expect(inactive).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => itemColor(inactive, '::before')).toBe(selected);
  await expect.poll(() => itemColor(active, '::before')).toBe(hover);
});
