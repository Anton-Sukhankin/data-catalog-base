import { expect, test } from '@playwright/test';

const entry = '/preview/navigation?section=questions&questions.tab=mine';
const appealTitle = 'Доступ к отчёту «План-Факт продажи»';

test('each status filters the list while the tab keeps the complete count', async ({ page }) => {
  await page.goto(entry);
  const statuses = page.getByRole('group', { name: 'Статус обращения' });
  const panel = page.getByRole('tabpanel', { name: /^Мои вопросы/ });
  const cards = panel.getByRole('list', { name: 'Список обращений' }).getByRole('listitem');
  const all = statuses.getByRole('button', { name: 'Все 6', exact: true });
  const counters = statuses.locator('[data-control-count]');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(counters).toHaveText(['6', '2', '2', '1', '1']);
  const activeSegmentCounter = page.getByRole('tab', { name: 'Мои вопросы 6' }).locator('[data-control-count]');
  const activeColor = await activeSegmentCounter.evaluate(element => getComputedStyle(element).backgroundColor);
  await expect(all.locator('[data-control-count]')).toHaveCSS('background-color', activeColor);
  await expect(cards).toHaveCount(6);
  await expect(panel.getByRole('status')).toBeEmpty();

  for (const [label, count] of [['Новый', 2], ['В работе', 2], ['Решён', 1], ['Закрыт', 1]] as const) {
    const chip = statuses.getByRole('button', { name: `${label} ${count}`, exact: true });
    await chip.press('Space');
    await expect(statuses.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(chip.locator('[data-control-count]')).toHaveCSS('background-color', activeColor);
    await expect(all.locator('[data-control-count]')).toHaveCSS('background-color', 'rgb(226, 228, 234)');
    await expect(counters).toHaveText(['6', '2', '2', '1', '1']);
    await expect(cards).toHaveCount(count);
    await expect(cards.getByText(label, { exact: true })).toHaveCount(count);
    await expect(panel.getByRole('status')).toHaveText(count === 1 ? '1 обращение' : '2 обращения');
    await expect(page.getByRole('tab', { name: 'Мои вопросы 6' })).toBeVisible();
  }
  await all.click();
  await expect(cards).toHaveCount(6);
  await expect(panel.getByRole('status')).toBeEmpty();
});

test('combines message search and status, restores both tab contexts and resets empty results', async ({ page }) => {
  await page.goto(entry);
  const tabs = page.getByRole('tablist', { name: 'Вопросы и ответы' });
  const statuses = page.getByRole('group', { name: 'Статус обращения' });
  const search = page.getByRole('searchbox', { name: 'Поиск по темам и сообщениям' });
  const panel = page.getByRole('tabpanel', { name: /^Мои вопросы/ });
  const cards = panel.getByRole('listitem');
  const work = statuses.getByRole('button', { name: /^В работе \d+$/ });
  await search.fill('  ПЛАН-ФАКТ  ');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(appealTitle);
  await search.fill('недостаточных правах');
  await expect(statuses.locator('[data-control-count]')).toHaveText(['1', '0', '1', '0', '0']);
  await work.click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(appealTitle);

  await tabs.getByRole('tab', { name: /^FAQ/ }).click();
  await expect(statuses).toHaveCount(0);
  const faqSearch = page.getByRole('searchbox', { name: 'Поиск в FAQ' });
  await expect(faqSearch).toHaveValue('');
  await faqSearch.fill('Где найти метрики');
  const faqQuestion = page.getByRole('tabpanel').getByRole('button', { name: 'Где найти метрики?' });
  await faqQuestion.click();
  await tabs.getByRole('tab', { name: /^Мои вопросы/ }).click();
  await expect(search).toHaveValue('недостаточных правах');
  await expect(work).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(1);

  await statuses.getByRole('button', { name: 'Новый 0', exact: true }).click();
  await expect(cards).toHaveCount(0);
  await expect(panel.getByRole('heading', { name: 'Обращения не найдены' })).toBeVisible();
  await expect(panel.getByRole('status')).toHaveText('0 обращений');
  await panel.getByRole('button', { name: 'Сбросить условия' }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(cards).toHaveCount(6);
  await expect(statuses.getByRole('button', { name: 'Все 6', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await work.click();
  await search.fill('план-факт');
  await page.getByRole('button', { name: 'Очистить поиск по обращениям' }).click();
  await expect(cards).toHaveCount(2);
  await expect(work).toHaveAttribute('aria-pressed', 'true');

  await tabs.getByRole('tab', { name: /^FAQ/ }).click();
  await expect(faqSearch).toHaveValue('Где найти метрики');
  await expect(faqQuestion).toHaveAttribute('aria-expanded', 'true');
});

test('distinguishes an empty source from zero matches', async ({ page }) => {
  await page.goto(entry + '&questionsCase=empty');
  const panel = page.getByRole('tabpanel', { name: /^Мои вопросы/ });
  await expect(page.getByRole('tab', { name: 'Мои вопросы 0' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Поиск по темам и сообщениям' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Статус обращения' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Задать вопрос' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'У вас пока нет обращений' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Обращения не найдены' })).toHaveCount(0);
  await expect(panel.getByRole('list')).toHaveCount(0);
  await expect(panel.getByRole('status')).toBeEmpty();
});

for (const [width, height] of [[1440, 900], [1024, 768]]) {
  test(`appeal layout and inert rows at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(entry);
    await expect(page).toHaveTitle(/Каталог данных/);
    await page.evaluate(() => document.fonts.ready);

    const main = page.getByRole('main');
    const tabs = main.getByRole('tablist');
    const search = main.getByRole('searchbox');
    const action = main.getByRole('button', { name: 'Задать вопрос', exact: true });
    const statuses = main.getByRole('group', { name: 'Статус обращения' });
    const cards = main.getByRole('list', { name: 'Список обращений' }).getByRole('listitem');
    await expect(cards).toHaveCount(6);
    const [tabBox, searchBox, actionBox] = await Promise.all([tabs.boundingBox(), search.boundingBox(), action.boundingBox()]);
    expect(tabBox!.x + tabBox!.width).toBeLessThan(searchBox!.x);
    expect(searchBox!.x + searchBox!.width).toBeLessThan(actionBox!.x);
    expect(tabBox!.y).toBe(actionBox!.y);
    expect(await search.evaluate((input: HTMLInputElement) => {
      const context = document.createElement('canvas').getContext('2d')!;
      context.font = getComputedStyle(input).font;
      return context.measureText(input.placeholder).width <= input.clientWidth;
    })).toBe(true);
    expect(await statuses.getByRole('button').evaluateAll(buttons => new Set(buttons.map(button => button.getBoundingClientRect().top)).size)).toBe(1);
    await expect(statuses).toHaveCSS('border-top-width', '1px');
    expect(await main.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);

    const first = cards.first();
    const heading = first.getByRole('heading');
    const date = first.locator('time');
    await expect(date).toHaveText('06.11.2026, 10:24');
    await expect(date).toHaveAttribute('datetime', '2026-11-06T10:24:00+03:00');
    expect(await heading.evaluate(element => element.nextElementSibling!.getBoundingClientRect().top - element.getBoundingClientRect().bottom)).toBe(8);
    expect((await first.boundingBox())!.x).toBe((await statuses.boundingBox())!.x - 1);
    const background = await first.evaluate(element => getComputedStyle(element).backgroundColor);
    await expect(first).toHaveCSS('border-top-color', 'rgb(215, 230, 245)');
    await first.hover();
    await expect(first).toHaveCSS('border-top-color', 'rgb(64, 143, 231)');
    await expect(first).toHaveCSS('background-color', background);
    await expect(heading).not.toHaveAttribute('data-overflow-clipped');
    await first.click();
    await expect(page).toHaveURL(/questions\.tab=mine$/);
    await expect(first.getByRole('button')).toHaveCount(0);
    await expect(first.getByRole('link')).toHaveCount(0);
    await page.mouse.move(width - 6, 60);
    await expect(first).toHaveCSS('border-top-color', 'rgb(215, 230, 245)');
    await page.screenshot({ path: testInfo.outputPath(`mine-all-${width}.png`) });

    if (width === 1024) {
      const long = cards.last().getByRole('heading');
      await expect(long).toHaveAttribute('data-overflow-clipped', 'true');
      await long.hover();
      await expect(page.getByRole('tooltip')).toContainText('с показателями за прошлый период');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('tooltip')).toHaveCount(0);
    }
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
