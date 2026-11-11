import { expect, test, type Page } from '@playwright/test';

const entry = '/preview/navigation?section=reports&report=demo-report-sales-plan&reportTab=mailings';

async function openManual(page: Page) {
  await page.goto(entry);
  await page.getByRole('button', { name: 'Ручная отправка', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Каналы доставки' })).toBeVisible();
}

test('manual delivery keeps the two fixed surfaces and the last sheet reachable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 620 }]) {
    await page.setViewportSize(viewport);
    await openManual(page);
    const scroll = page.getByRole('tabpanel');
    const tabs = page.getByRole('tablist', { name: 'Вкладки паспорта отчёта' });
    const segments = page.locator('[data-mailings-segment-bar]');
    const footer = page.getByRole('region', { name: 'Итог ручной отправки' });
    const selects = page.locator('[data-manual-delivery] [data-multi-select]');
    const last = page.getByRole('button', { name: 'Прогноз за дату', exact: true });

    await expect(selects).toHaveCount(3);
    expect(new Set(await selects.evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().width)))).size).toBe(1);
    await expect(footer).toHaveCSS('position', 'sticky');
    await expect(footer).toHaveCSS('height', '64px');
    await expect(footer).toHaveCSS('border-top-left-radius', '20px');
    await expect(footer.getByRole('button', { name: 'Отправить' })).toHaveCSS('font-size', '14px');
    await expect(footer).toContainText('1 канал · 13 листов');
    expect(await scroll.evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(await scroll.evaluate(element => element.clientWidth));

    for (const position of [0, 360, Infinity]) {
      await scroll.evaluate((element, value) => { element.scrollTop = value === Infinity ? element.scrollHeight : value; }, position);
      await expect.poll(async () => {
        const [tab, segment] = await Promise.all([tabs.boundingBox(), segments.boundingBox()]);
        return Math.round(segment!.y - tab!.y - tab!.height);
      }).toBe(16);
      const [panel, bottom, segment] = await Promise.all([scroll.boundingBox(), footer.boundingBox(), segments.boundingBox()]);
      expect(bottom!.y + bottom!.height).toBeCloseTo(panel!.y + panel!.height, 0);
      expect(bottom!.width).toBeCloseTo(segment!.width, 0);
    }

    await last.focus();
    await expect(last).toBeFocused();
    const [sheet, bottom] = await Promise.all([last.boundingBox(), footer.boundingBox()]);
    expect(sheet!.y + sheet!.height).toBeLessThan(bottom!.y);
    await last.press('Enter');
    const expandedSheet = page.locator('[data-delivery-sheet]').last();
    const bodyText = expandedSheet.locator('[data-accordion-body] p');
    await expect(bodyText).toBeVisible();
    const [chevron, text] = await Promise.all([last.locator('span').first().boundingBox(), bodyText.boundingBox()]);
    expect(text!.x).toBeCloseTo(chevron!.x, 1);
  }
});

test('recipient selection isolates draft, applied chips and the other fields', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openManual(page);
  const mail = page.locator('[data-multi-select="mail"]');
  const trigger = mail.getByRole('button', { name: /^Получатели почты/ });
  const chevron = trigger.locator('img');
  const [fieldBounds, chevronBounds] = await Promise.all([trigger.boundingBox(), chevron.boundingBox()]);
  expect(fieldBounds!.x + fieldBounds!.width - chevronBounds!.x - chevronBounds!.width).toBeCloseTo(13, 0);
  await trigger.focus();
  await trigger.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Получатели почты' });
  const search = menu.getByRole('searchbox');
  await expect(search).toBeFocused();
  expect((await menu.boundingBox())!.width).toBeCloseTo(fieldBounds!.width, 0);
  await expect(chevron).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
  await search.fill('Анна');
  await expect(menu.getByRole('checkbox')).toHaveCount(1);
  await menu.getByRole('checkbox', { name: 'Анна Петрова' }).check();
  const tags = mail.locator('[data-selected-tag]');
  const footer = page.locator('[data-manual-delivery-footer]');
  await expect(tags).toHaveText(['Анна Петрова']);
  await expect(footer).not.toContainText('Анна Петрова');
  await search.clear();
  await menu.getByRole('checkbox', { name: 'Иван Смирнов' }).check();
  await expect(tags).toHaveText(['Анна Петрова', 'Иван Смирнов']);
  await mail.getByRole('button', { name: /Удалить тег.*Анна Петрова/ }).click();
  await expect(menu.getByRole('checkbox', { name: 'Анна Петрова' })).not.toBeChecked();
  await expect(tags).toHaveText(['Иван Смирнов']);
  await menu.getByRole('checkbox', { name: 'Анна Петрова' }).check();
  const actions = menu.locator('[data-filter-actions]');
  await expect(actions).toHaveCSS('padding', '12px');
  await expect(actions).toHaveCSS('gap', '8px');
  const [reset, apply] = await actions.getByRole('button').all();
  expect((await reset.boundingBox())!.width).toBeCloseTo((await apply.boundingBox())!.width, 0);
  await apply.click();
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(mail.locator('[data-selected-tag]')).toHaveCount(2);
  await expect(footer).toContainText('Анна Петрова');

  await trigger.click();
  await menu.getByRole('checkbox', { name: 'Мария Волкова' }).check();
  await expect(tags).toHaveText(['Анна Петрова', 'Иван Смирнов', 'Мария Волкова']);
  await search.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(mail.locator('[data-selected-tag]')).toHaveCount(2);
  await mail.getByRole('button', { name: /Удалить тег.*Анна Петрова/ }).click();
  await expect(mail.locator('[data-selected-tag]')).toHaveCount(1);
  await expect(mail.locator('[data-selected-tag]')).toHaveText('Иван Смирнов');

  await trigger.click();
  await reset.click();
  await expect(menu.getByRole('checkbox', { name: 'Иван Смирнов' })).not.toBeChecked();
  await expect(tags).toHaveCount(0);
  await page.getByRole('heading', { name: 'Каналы доставки' }).click();
  await expect(menu).toBeHidden();
  await expect(mail.locator('[data-selected-tag]')).toHaveCount(1);
  await trigger.click();
  await reset.click();
  await apply.click();
  await expect(mail.locator('[data-selected-tag]')).toHaveCount(0);
  await expect(page.locator('[data-multi-select^="talk"] [data-selected-tag]')).toHaveCount(0);
});

test('manual controls update the local summary and other modes keep their own layout', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 720 });
  await openManual(page);
  const mail = page.locator('[data-delivery-channel="mail"]');
  const accordion = mail.getByRole('button', { name: 'Почта', exact: true });
  const self = mail.getByRole('switch');
  const footer = page.getByRole('region', { name: 'Итог ручной отправки' });
  const send = footer.getByRole('button', { name: 'Отправить', exact: true });
  const reset = footer.getByRole('button', { name: 'Сбросить', exact: true });
  await expect(reset).toBeDisabled();
  await self.uncheck();
  await expect(accordion).toHaveAttribute('aria-expanded', 'true');
  await expect(send).toBeDisabled();
  await expect(footer).toContainText('Укажите получателя хотя бы для одного канала.');
  await expect(reset).toBeEnabled();
  await accordion.click();
  await expect(accordion).toHaveAttribute('aria-expanded', 'false');
  await expect(self).toBeVisible();

  const sheet = page.locator('[data-delivery-sheet]').first();
  const sheetButton = sheet.getByRole('button');
  await sheet.getByRole('checkbox').uncheck();
  await expect(sheetButton).toHaveAttribute('aria-expanded', 'false');
  await expect(footer).toContainText('12 листов');
  await sheetButton.focus();
  await sheetButton.press('Enter');
  await expect(sheetButton).toHaveAttribute('aria-expanded', 'true');
  await expect(sheet.getByRole('checkbox')).not.toBeChecked();
  await reset.click();
  await expect(footer).toContainText('1 канал · 13 листов');
  await expect(send).toBeEnabled();
  await send.click();
  const notice = page.getByRole('status');
  await expect(notice).toContainText('Отчёт не отправлен');
  const [noticeBounds, footerBounds] = await Promise.all([notice.boundingBox(), footer.boundingBox()]);
  expect(noticeBounds!.y + noticeBounds!.height).toBeLessThanOrEqual(footerBounds!.y - 16);

  await page.getByRole('button', { name: 'Доступные рассылки', exact: true }).click();
  await expect(footer).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Сведения об отчёте' })).toBeVisible();
  await page.getByRole('button', { name: 'Создать рассылку', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Новая рассылка' })).toBeVisible();
  await expect(footer).toHaveCount(0);

  await page.goto(entry.replace('demo-report-sales-plan', 'demo-report-canopy'));
  await page.getByRole('button', { name: 'Ручная отправка', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ручная отправка недоступна' })).toBeVisible();
  await expect(footer).toHaveCount(0);
});

test('manual delivery is available for every report on the first catalog page', async ({ page }) => {
  await page.goto('/preview/navigation?section=reports');
  const rows = page.locator('[data-table-report-id]');
  await expect(rows).toHaveCount(15);
  const reportIds = await rows.evaluateAll(elements => elements.map(element => element.getAttribute('data-table-report-id')!));
  const sheetNames = new Map<string, string[]>();
  for (const reportId of reportIds) {
    await page.goto(entry.replace('demo-report-sales-plan', reportId));
    await page.getByRole('button', { name: 'Ручная отправка', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Каналы доставки' })).toBeVisible();
    const sheets = page.locator('[data-delivery-sheet]').getByRole('button');
    await expect(sheets.first()).toBeVisible();
    sheetNames.set(reportId, await sheets.allTextContents());
  }
  expect(sheetNames.get('demo-report-motivation')).toEqual(['План и факт по командам', 'Качество обслуживания']);
  expect(sheetNames.get('demo-report-sales-plan')).toHaveLength(13);
  expect(sheetNames.get('demo-report-summary--pagination-demo-10')).toEqual(sheetNames.get('demo-report-summary'));
  expect(sheetNames.get('demo-report-motivation--pagination-demo-11')).toEqual(sheetNames.get('demo-report-motivation'));
});
