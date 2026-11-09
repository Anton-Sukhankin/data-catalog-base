import { expect, test } from '@playwright/test';

const faqEntry = '/preview/navigation?section=questions';
const mineEntry = faqEntry + '&questions.tab=mine';
const addedNotice = 'Вопрос добавлен в демонстрационный список';

test('the dialog validates both fields and each dismissal restores focus and discards the draft', async ({ page }) => {
  await page.goto(faqEntry);
  const trigger = page.getByRole('button', { name: 'Задать вопрос', exact: true });
  const modal = page.getByRole('dialog', { name: 'Задать вопрос' });
  const subject = modal.getByRole('textbox', { name: 'Тема', exact: true });
  const message = modal.getByRole('textbox', { name: 'Ваш вопрос', exact: true });
  const send = modal.getByRole('button', { name: 'Отправить вопрос' });

  await trigger.press('Enter');
  await expect(subject).toBeFocused();
  await expect(subject).toHaveValue('');
  await expect(message).toHaveValue('');
  await expect(subject).toHaveAttribute('required', '');
  await expect(message).toHaveAttribute('required', '');
  await expect(send).toBeEnabled();
  await modal.getByRole('heading', { name: 'Задать вопрос' }).click();
  await expect(modal.getByRole('alert')).toHaveCount(0);
  await subject.fill('   ');
  await subject.press('Tab');
  await expect(message).toBeFocused();
  await expect(modal.getByRole('alert')).toHaveCount(0);
  await message.fill('  ');
  await message.press('Tab');
  await expect(modal.getByRole('button', { name: 'Отмена', exact: true })).toBeFocused();
  await expect(modal.getByRole('alert')).toHaveCount(0);
  await send.click();
  await expect(subject).toBeFocused();
  await expect(subject).toHaveAccessibleDescription('Поле «Тема» обязательно для заполнения.');
  await expect(message).toHaveAccessibleDescription('Введите текст вопроса, чтобы отправить его.');
  await expect(send).toBeEnabled();
  await subject.fill('Проверочная тема');
  await expect(subject).not.toHaveAttribute('aria-invalid', 'true');
  await send.click();
  await expect(message).toBeFocused();
  await expect(modal.getByRole('alert')).toHaveCount(1);
  await message.fill('Черновик, который нужно отменить');
  await expect(modal.getByRole('alert')).toHaveCount(0);
  await expect(send).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();

  for (const name of ['Закрыть форму вопроса', 'Отмена']) {
    await trigger.click();
    await expect(subject).toBeFocused();
    await expect(subject).toHaveValue('');
    await expect(message).toHaveValue('');
    await expect(modal.getByRole('alert')).toHaveCount(0);
    await subject.fill('Новый черновик');
    await modal.getByRole('button', { name, exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await expect(page.getByRole('tab', { name: 'Мои вопросы 6', exact: true })).toBeVisible();
  await expect(page.getByText(addedNotice, { exact: true })).toHaveCount(0);
});

test('submits once from FAQ and keeps the expanded answer and both tab contexts', async ({ page }) => {
  await page.goto(mineEntry);
  const tabs = page.getByRole('tablist', { name: 'Вопросы и ответы' });
  const newChip = page.getByRole('button', { name: /^Новый \d+$/ });
  const mineSearch = page.getByRole('searchbox', { name: 'Поиск по темам и сообщениям' });
  await newChip.click();
  await mineSearch.fill('проверочный отчёт');

  await tabs.getByRole('tab', { name: /^FAQ/ }).click();
  const faqSearch = page.getByRole('searchbox', { name: 'Поиск в FAQ' });
  await faqSearch.fill('как получить доступ');
  const answer = page.getByRole('button', { name: 'Как получить доступ к отчёту?', exact: true });
  await answer.click();
  const trigger = page.getByRole('button', { name: 'Задать вопрос', exact: true });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Задать вопрос' });
  await modal.getByRole('textbox', { name: 'Тема', exact: true }).fill('  Проверочный отчёт  ');
  await modal.getByRole('textbox', { name: 'Ваш вопрос', exact: true }).fill('  Уточните порядок доступа.  ');
  await modal.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });

  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/section=questions$/);
  await expect(faqSearch).toHaveValue('как получить доступ');
  await expect(answer).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(addedNotice, { exact: true })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Мои вопросы 7', exact: true }).click();
  await expect(mineSearch).toHaveValue('проверочный отчёт');
  await expect(newChip).toHaveAttribute('aria-pressed', 'true');
  const list = page.getByRole('list', { name: 'Список обращений' });
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list.getByRole('heading')).toHaveText('Проверочный отчёт');
  await expect(list.getByText('Новый', { exact: true })).toBeVisible();
  await expect(list.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d\d-\d\dT/);
  await mineSearch.fill('порядок доступа');
  await expect(list.getByRole('heading')).toHaveText('Проверочный отчёт');
  await mineSearch.fill('');
  await expect(newChip).toHaveAccessibleName('Новый 3');
  await expect(page.getByRole('button', { name: 'Все 7', exact: true })).toBeVisible();
});

test('submits from My questions without resetting its active filter and retains the item until reload', async ({ page }) => {
  await page.goto(mineEntry);
  const work = page.getByRole('button', { name: /^В работе \d+$/ });
  await work.click();
  const trigger = page.getByRole('button', { name: 'Задать вопрос', exact: true });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Задать вопрос' });
  await modal.getByRole('textbox', { name: 'Тема', exact: true }).fill('Согласование новой метрики');
  await modal.getByRole('textbox', { name: 'Ваш вопрос', exact: true }).fill('Кто подтверждает описание показателя?');
  await modal.getByRole('button', { name: 'Отправить вопрос' }).click();
  await expect(page).toHaveURL(/questions\.tab=mine$/);
  await expect(work).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Согласование новой метрики' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Мои вопросы 7', exact: true })).toBeVisible();
  await expect(page.getByText(addedNotice, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть уведомление' }).click();
  await expect(trigger).toBeFocused();

  const nav = page.getByRole('navigation', { name: 'Разделы каталога' });
  await nav.getByRole('button', { name: 'Справочники ИС', exact: true }).click();
  await expect(page).toHaveURL(/section=systems/);
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Мои вопросы 7', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Новый \d+$/ }).click();
  await expect(page.getByRole('heading', { name: 'Согласование новой метрики' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Мои вопросы 6', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Согласование новой метрики' })).toHaveCount(0);
});

for (const [width, height] of [[1440, 900], [1024, 768]]) {
  test(`modal covers the workspace at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(width === 1440 ? faqEntry : mineEntry);
    if (width === 1440) await page.getByRole('button', { name: 'Как получить доступ к отчёту?', exact: true }).click();
    else await page.getByRole('button', { name: /^В работе \d+$/ }).click();
    await page.getByRole('button', { name: 'Задать вопрос', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Задать вопрос' });
    const subject = modal.getByRole('textbox', { name: 'Тема', exact: true });
    await expect(subject).toBeFocused();
    expect(await modal.evaluate(element => ({
      modal: element.matches(':modal'),
      backdrop: getComputedStyle(element, '::backdrop').backgroundColor,
      topLeft: document.elementFromPoint(12, 12) === element,
    }))).toEqual({ modal: true, backdrop: 'rgba(16, 29, 59, 0.36)', topLeft: true });
    const box = (await modal.boundingBox())!;
    expect(box.width).toBe(560);
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
    expect(box.y + box.height / 2).toBeCloseTo(height / 2, 0);
    await page.evaluate(() => document.fonts.ready);
    await subject.fill('Доступ к отчёту «План-Факт продажи»');
    await modal.getByRole('textbox', { name: 'Ваш вопрос', exact: true }).fill(
      'Карточка отчёта открывается, но при запуске вижу сообщение «Доступ запрещён». Подскажите, куда обратиться за доступом?',
    );
    await page.mouse.click(12, 12);
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Отправить вопрос' })).toBeEnabled();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`ask-filled-${width}.png`) });
  });
}
