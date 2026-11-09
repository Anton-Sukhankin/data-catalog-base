import { expect, test } from '@playwright/test';

const entry = '/preview/navigation?section=questions';
const accessQuestion = 'Как получить доступ к отчёту?';

test('FAQ uses sidebar navigation, URL tabs and browser history', async ({ page }) => {
  await page.goto('/preview/navigation');
  const nav = page.getByRole('navigation', { name: 'Разделы каталога' });
  const questions = nav.getByRole('button', { name: 'Вопросы и ответы', exact: true });
  await questions.click();
  await expect(questions).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/section=questions$/);

  const tabs = page.getByRole('tablist', { name: 'Вопросы и ответы' });
  const faq = tabs.getByRole('tab', { name: /^FAQ/ });
  const mine = tabs.getByRole('tab', { name: /^Мои вопросы/ });
  await expect(faq).toHaveAttribute('aria-selected', 'true');
  await faq.press('ArrowRight');
  await expect(mine).toBeFocused();
  await expect(mine).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/questions\.tab=mine/);
  await expect(page.getByRole('tabpanel', { name: /^Мои вопросы/ })).toBeVisible();
  await page.reload();
  await expect(mine).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(faq).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(mine).toHaveAttribute('aria-selected', 'true');

  await nav.getByRole('button', { name: 'Справочники ИС', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Справочники ИС', exact: true })).toBeVisible();
  await page.goBack();
  await expect(mine).toHaveAttribute('aria-selected', 'true');
  await faq.click();
  await expect(faq).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/section=questions$/);
});

test('switching question tabs animates only the incoming list and reveals the status chips', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(entry);
  const mine = page.getByRole('tab', { name: /^Мои вопросы/ });
  await expect(mine).toBeVisible();
  await expect(page.getByRole('group', { name: 'Статус обращения' })).toHaveCount(0);
  const animation = await mine.evaluate(button => new Promise<{ list: boolean; screen: boolean; heightChanged: boolean }>(resolve => {
    const toolbar = button.closest('[data-search]')!;
    const panel = toolbar.parentElement!;
    const screen = button.closest('[data-catalog-screen]')!;
    const initialHeight = panel.getBoundingClientRect().height;
    panel.addEventListener('transitionrun', () => {
      const list = screen.querySelector('[data-detail-tab-content]')!;
      const reveal = panel.querySelector('[data-open="true"]')!;
      const heightAnimation = reveal.getAnimations()[0];
      if (heightAnimation) {
        heightAnimation.pause();
        heightAnimation.currentTime = 100;
      }
      const heightChanged = panel.getBoundingClientRect().height > initialHeight;
      heightAnimation?.play();
      resolve({ list: list.getAnimations().length > 0, screen: screen.getAnimations().length > 0, heightChanged });
    }, { once: true });
    (button as HTMLButtonElement).click();
  }));
  expect(animation).toEqual({ list: true, screen: false, heightChanged: true });
  await expect(page.getByRole('group', { name: 'Статус обращения' })).toBeVisible();
  await page.getByRole('tab', { name: /^FAQ/ }).click();
  await expect(page.getByRole('group', { name: 'Статус обращения' })).toHaveCount(0);
});

test('FAQ search matches questions and answers without changing totals, and can be cleared', async ({ page }) => {
  await page.goto(entry);
  const panel = page.getByRole('tabpanel', { name: /^FAQ/ });
  const entries = panel.locator('button[aria-expanded]');
  const search = page.getByRole('searchbox', { name: 'Поиск в FAQ' });
  await expect(entries.first()).toBeVisible();
  const count = await entries.count();
  const tab = page.getByRole('tab', { name: `FAQ ${count}`, exact: true });
  expect(count).toBeGreaterThan(1);

  await search.fill('   ГДЕ НАЙТИ МЕТРИКИ   ');
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toHaveText('Где найти метрики?');
  await search.fill('НЕДОСТАТОЧНЫХ ПРАВАХ');
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toHaveText(accessQuestion);
  await expect(tab).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Поиск по каталогу' })).toHaveValue('');

  await search.fill('xyz-нет-совпадений');
  await expect(panel.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(entries).toHaveCount(0);
  await panel.getByRole('button', { name: 'Очистить запрос' }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(entries).toHaveCount(count);

  await search.fill('отчёт');
  await page.getByRole('button', { name: 'Очистить поиск в FAQ' }).click();
  await expect(search).toHaveValue('');
  await expect(entries).toHaveCount(count);
});

test('question content scrolls inside the fixed gray surround', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 430 });
  const viewport = page.getByRole('region', { name: 'Прокрутка вопросов и ответов' });
  const shell = viewport.locator('..');
  const title = page.getByRole('heading', { name: 'Вопросы и ответы', exact: true });
  for (const segment of ['FAQ', 'Мои вопросы']) {
    await test.step(segment, async () => {
      await page.goto(entry + (segment === 'FAQ' ? '' : '&questions.tab=mine'));
      const tabs = viewport.getByRole('tablist');
      const search = viewport.getByRole('searchbox');
      const ask = viewport.getByRole('button', { name: 'Задать вопрос', exact: true });
      const list = viewport.getByRole('tabpanel');
      const panel = viewport.locator('[data-scrolled]');
      const shadowOpacity = () => panel.evaluate(element => getComputedStyle(element, '::after').opacity);
      const titleBox = (await title.boundingBox())!;
      const descriptionBox = (await title.locator('xpath=following-sibling::p').boundingBox())!;
      const shellBox = (await shell.boundingBox())!;
      const controlsBefore = await Promise.all([tabs.boundingBox(), search.boundingBox(), ask.boundingBox()]);
      const listTop = (await list.boundingBox())!.y;
      expect(descriptionBox.y - titleBox.y - titleBox.height).toBe(4);
      expect((await viewport.boundingBox())!.y - shellBox.y).toBe(16);
      await expect(shell).toHaveCSS('background-color', 'rgb(243, 244, 249)');
      await expect.poll(shadowOpacity).toBe('0');
      expect((await panel.boundingBox())!.x - (await viewport.boundingBox())!.x).toBe(16);

      await viewport.press('PageDown');
      await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(shadowOpacity).toBe('1');
      expect(await panel.evaluate(element => getComputedStyle(element, '::after').boxShadow))
        .toBe('rgba(16, 29, 59, 0.24) 0px 10px 20px -7px');
      expect((await list.boundingBox())!.y).toBeLessThan(listTop);
      expect(await Promise.all([tabs.boundingBox(), search.boundingBox(), ask.boundingBox()])).toEqual(controlsBefore);
      expect(await title.boundingBox()).toEqual(titleBox);
      expect(await shell.boundingBox()).toEqual(shellBox);
      expect(await page.getByRole('main').evaluate(element => element.scrollTop)).toBe(0);
      await viewport.evaluate(element => { element.scrollTop = 0; });
      await expect.poll(shadowOpacity).toBe('0');
    });
  }
});

for (const [width, height] of [[1440, 900], [1024, 768]]) {
  test(`FAQ layout and shared disclosure at ${width}px`, async ({ page }, testInfo) => {
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
    const [tabBox, searchBox, actionBox] = await Promise.all([tabs.boundingBox(), search.boundingBox(), action.boundingBox()]);
    expect(tabBox!.x + tabBox!.width).toBeLessThan(searchBox!.x);
    expect(searchBox!.x + searchBox!.width).toBeLessThan(actionBox!.x);
    expect(Math.abs(tabBox!.y - actionBox!.y)).toBeLessThan(1);
    expect(await main.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    await expect(action).toBeEnabled();

    const panel = main.getByRole('tabpanel');
    const question = panel.getByRole('button', { name: accessQuestion, exact: true });
    await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`faq-closed-${width}.png`) });
    await question.press('Enter');
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByText(/недостаточных правах/)).toBeVisible();
    await question.press('Space');
    await expect(question).toHaveAttribute('aria-expanded', 'false');
    await question.click();
    await main.getByRole('heading', { name: 'Вопросы и ответы' }).click();
    await page.mouse.move(width - 6, 60);
    await expect(panel.locator('button[aria-expanded="true"]')).toHaveCount(1);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`faq-open-${width}.png`) });
  });
}
