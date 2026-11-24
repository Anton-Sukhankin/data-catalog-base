import { expect, test, type Locator } from '@playwright/test';

test('column range validates incomplete input and synchronizes the slider endpoints', async ({ page }) => {
  await page.goto('/preview/navigation?section=reports&tableCase=single-page');
  const heading = page.getByRole('button', { name: 'Фильтр «MAU»', exact: true });
  const menu = page.getByRole('dialog', { name: 'Фильтр: MAU', exact: true });
  const from = menu.getByRole('spinbutton', { name: 'MAU: от', exact: true });
  const to = menu.getByRole('spinbutton', { name: 'MAU: до', exact: true });
  const lower = menu.getByRole('slider', { name: 'MAU: нижняя граница', exact: true });
  const upper = menu.getByRole('slider', { name: 'MAU: верхняя граница', exact: true });
  const apply = menu.getByRole('button', { name: 'Применить', exact: true });

  await heading.click();
  await to.press('-');
  await expect(menu.getByRole('alert')).toBeVisible();
  await expect(apply).toBeDisabled();
  await menu.getByRole('button', { name: 'От 50', exact: true }).click();
  await expect(from).toHaveValue('50');
  expect(await to.evaluate(field => (field as HTMLInputElement).validity.badInput)).toBe(false);
  await expect(lower).toHaveValue('50');
  await lower.press('Home');
  await expect(from).toHaveValue('0');
  await to.fill('200');
  await expect(upper).toHaveValue('200');
  await upper.press('End');
  await expect(to).toHaveValue('500');
  await from.fill('201');
  await to.fill('200');
  await expect(apply).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(heading).toBeFocused();
  await heading.click();
  await expect(from).toHaveValue('');
  await expect(to).toHaveValue('');
});

test('report resets preserve sorting and return to the first page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview/navigation?section=reports');
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const domain = page.getByRole('dialog', { name: 'Фильтр: Домен', exact: true });
  const mau = page.getByRole('dialog', { name: 'Фильтр: MAU', exact: true });
  const mauHeading = button('Фильтр «MAU»');
  const mauColumn = page.getByRole('columnheader').filter({ has: mauHeading });
  const openPanel = button('Открыть фильтры отчётов');
  const pagination = page.getByRole('navigation', { name: 'Страницы отчётов', exact: true });

  await button('Фильтр «Домен»').click();
  for (const name of ['Гостеприимство', 'Клиентский сервис', 'Продажи и маркетинг', 'Финансы'])
    await domain.getByRole('checkbox', { name, exact: true }).check();
  await domain.getByRole('button', { name: 'Применить', exact: true }).click();
  await mauHeading.click();
  await mau.getByRole('spinbutton', { name: 'MAU: от', exact: true }).fill('50');
  await mau.getByRole('spinbutton', { name: 'MAU: до', exact: true }).fill('200');
  await mau.getByRole('button', { name: 'По возрастанию', exact: true }).click();
  await mau.getByRole('button', { name: 'Применить', exact: true }).click();
  await expect(button('Сбросить все фильтры: 2 атрибута')).toHaveText('2');
  await mauHeading.click();
  await button('Сбросить фильтр «MAU»').click();
  await expect(mau).toHaveCount(0);
  await expect(mauColumn).toHaveAttribute('aria-sort', 'ascending');
  const reset = button('Сбросить все фильтры: 1 атрибут');
  await expect(reset).toHaveText('1');
  await button('Следующая страница').click();
  await expect(pagination).toContainText('16–30');
  await openPanel.press('Tab');
  await expect(reset).toBeFocused();
  await expect(reset.locator('svg')).toBeVisible();
  await reset.press('Enter');
  await expect(reset).toHaveCount(0);
  await expect(pagination).toContainText('1–15');
  await expect(mauColumn).toHaveAttribute('aria-sort', 'ascending');
  await expect(openPanel).toBeFocused();

  await mauHeading.click();
  await mau.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(mauColumn).toHaveAttribute('aria-sort', 'none');
});

for(const context of ['catalog','favorites'] as const) {
  test(`${context}: numerical ranges and exclusive thresholds stay synchronized across panel and columns`, async ({page})=>{
    await page.setViewportSize({width:1440,height:900});
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`/preview/navigation?section=${context==='catalog'?'reports':'home'}&segment=favorites&paginationDemo=0`);
    const rows=page.locator('[data-table-report-id]');
    const initialCount=context==='catalog'?9:10;
    await expect(rows).toHaveCount(initialCount);
    const open=page.getByRole('button',{name:'Открыть фильтры отчётов',exact:true});
    const panel=page.locator('[data-report-filter-panel]');
    const min=(label:string)=>panel.getByRole('spinbutton',{name:`${label}: от`,exact:true});
    const max=(label:string)=>panel.getByRole('spinbutton',{name:`${label}: до`,exact:true});
    await open.click();
    const mau=panel.locator('[data-report-range="mau"]');
    const last=panel.locator('[data-report-range="lastViewed"]');
    expect((await mau.boundingBox())!.width).toBe(440);expect((await last.boundingBox())!.width).toBe(440);
    expect((await last.boundingBox())!.y).toBeGreaterThan((await mau.boundingBox())!.y+(await mau.boundingBox())!.height);
    await mau.getByRole('button',{name:'От 50',exact:true}).click();
    await mau.getByRole('button',{name:'От 100',exact:true}).click();
    await expect(mau.locator('button[aria-pressed="true"]')).toHaveCount(1);
    await expect(min('MAU')).toHaveValue('100');await expect(max('MAU')).toHaveValue('');
    await max('Последний просмотр').fill('2');
    await expect(panel.locator('[data-panel-count]')).toHaveText('2');
    await expect(rows).toHaveCount(initialCount);
    await panel.getByRole('button',{name:'Применить',exact:true}).click();
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-table-report-id')))).toEqual(['demo-report-summary','demo-report-finance-plan']);
    await open.click();await min('MAU').fill('250');await max('MAU').fill('100');
    await expect(panel.getByRole('alert')).toBeVisible();
    await expect(panel.getByRole('button',{name:'Применить',exact:true})).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Фильтр «MAU»',exact:true}).click();
    const menu=page.getByRole('dialog',{name:'Фильтр: MAU',exact:true});
    await expect(menu.getByRole('spinbutton',{name:'MAU: от',exact:true})).toHaveValue('100');
    await expect(menu.getByRole('checkbox')).toHaveCount(0);
    await menu.getByRole('button',{name:'От 500',exact:true}).click();
    await menu.getByRole('button',{name:'Применить',exact:true}).click();
    await expect(rows).toHaveCount(0);
    await open.click();await expect(min('MAU')).toHaveValue('500');
    await panel.getByRole('button',{name:'Сбросить',exact:true}).click();
    await expect(panel).toBeVisible();await expect(rows).toHaveCount(0);
    await panel.getByRole('button',{name:'Применить',exact:true}).click();
    await expect(rows).toHaveCount(initialCount);
    await open.click();
    const lower=panel.getByRole('slider',{name:'MAU: нижняя граница',exact:true});
    await lower.focus();await lower.press('ArrowRight');
    await expect(min('MAU')).toHaveValue('1');
    await panel.getByRole('button',{name:'Сбросить',exact:true}).click();
    await page.setViewportSize({width:1280,height:700});
    await max('Последний просмотр').fill('7');
    await expect(panel.getByRole('button',{name:'Применить',exact:true})).toBeVisible();
    await panel.getByRole('button',{name:'Применить',exact:true}).click();
    await expect(rows).toHaveCount(context==='catalog'?7:6);
    expect(errors).toEqual([]);
  });
}


test('dark range defaults are visible and neutral in the panel and both column menus', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/preview/navigation?section=reports');
  const theme = page.getByRole('button', { name: 'Тёмная тема' });
  const opener = page.getByRole('button', { name: 'Открыть фильтры отчётов', exact: true });
  const panel = page.locator('[data-report-filter-panel]');
  const mau = panel.locator('[data-report-range="mau"]');
  const lastViewed = panel.locator('[data-report-range="lastViewed"]');
  const band = (field: typeof mau) => field.locator('[data-range-band]');
  const chip = mau.getByRole('button', { name: 'От 50', exact: true });
  const movePointerOutside = () => page.mouse.move(12, 48);

  await opener.click();
  await expect(band(mau)).toHaveCSS('background-color', 'rgb(0, 123, 252)');
  await expect(chip).toHaveCSS('background-color', 'rgb(240, 241, 244)');
  await movePointerOutside();
  await mau.screenshot({ path: info.outputPath('range-light-panel-mau.png') });
  await page.keyboard.press('Escape');
  await theme.click();
  await opener.click();
  await movePointerOutside();

  async function expectUnbounded(field: typeof mau) {
    await expect(field).toHaveAttribute('data-bounded', 'false');
    await expect(field.locator('[data-range-track]')).toHaveCSS('background-color', 'rgb(133, 138, 150)');
    await expect(band(field)).toHaveCSS('background-color', 'rgb(133, 138, 150)');
    await expect(field.locator('input[type="number"]')).toHaveCount(2);
    for (const input of await field.locator('input[type="number"]').all()) await expect(input).toHaveValue('');
    await expect(field.locator('img')).toHaveCount(2);
    for (const knob of await field.locator('img').all()) {
      await expect.poll(() => knob.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(68);
    }
  }
  await expectUnbounded(mau);
  await expectUnbounded(lastViewed);
  const presets = mau.getByRole('group', { name: 'Пороги MAU' });
  await expect(presets.getByRole('button')).toHaveCount(4);
  for (const preset of await presets.getByRole('button').all()) {
    await expect(preset).toHaveAttribute('aria-pressed', 'false');
    await expect(preset).toHaveCSS('background-color', 'rgb(32, 33, 37)');
    await expect(preset).toHaveCSS('box-shadow', /rgb\(133, 138, 150\).*inset/);
  }
  await mau.screenshot({ path: info.outputPath('range-dark-panel-mau.png') });
  await lastViewed.screenshot({ path: info.outputPath('range-dark-panel-viewed.png') });

  const handle = mau.locator('img').first().locator('..');
  const bounds = (await handle.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 90, y, { steps: 6 });
  await page.mouse.up();
  const lower = mau.getByRole('slider', { name: 'MAU: нижняя граница' });
  await expect.poll(async () => Number(await lower.inputValue())).toBeGreaterThan(0);
  await expect(mau).toHaveAttribute('data-bounded', 'true');
  await expect(band(mau)).toHaveCSS('background-color', 'rgb(134, 184, 255)');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(mau.getByRole('spinbutton', { name: 'MAU: от' })).toHaveValue('50');
  await expect(mau.getByRole('spinbutton', { name: 'MAU: до' })).toHaveValue('');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1920, height: 1000 });

  for (const [column, attribute, filename] of [
    ['MAU', 'mau', 'range-dark-column-mau.png'],
    ['Просмотр', 'lastViewed', 'range-dark-column-viewed.png'],
  ]) {
    await page.getByRole('button', { name: `Фильтр «${column}»`, exact: true }).click();
    await movePointerOutside();
    const menuRange = page.getByRole('dialog').locator(`[data-report-range="${attribute}"]`);
    await expectUnbounded(menuRange);
    await menuRange.screenshot({ path: info.outputPath(filename) });
    await page.keyboard.press('Escape');
  }
});

for (const [theme, accent] of [['light', 'rgb(0, 123, 252)'], ['dark', 'rgb(134, 184, 255)']]) {
  test(`range handles and the active value stay highlighted through a drag in ${theme}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/preview/navigation?section=reports');
    const toggle = page.getByRole('button', { name: 'Тёмная тема', exact: true });
    if ((await toggle.getAttribute('aria-pressed') === 'true') !== (theme === 'dark')) await toggle.click();

    async function captureRange(field: Locator, filename: string) {
      const { x, y, width, height } = (await field.boundingBox())!;
      await page.screenshot({ path: info.outputPath(filename), clip: { x: x - 4, y: y - 4, width: width + 8, height: height + 8 } });
    }

    async function checkRange(field: Locator, panel: boolean) {
      for (const [bound, label, direction] of [['min', 'от', 1], ['max', 'до', -1]] as const) {
        const marker = field.locator(`[data-range-knob="${bound}"]`);
        const otherMarker = field.locator(`[data-range-knob]:not([data-range-knob="${bound}"])`);
        const slider = field.locator(`[data-range-bound="${bound}"]`);
        const number = field.getByRole('spinbutton', { name: new RegExp(`: ${label}$`) });
        const caption = number.locator('..').locator('span');
        const values = number.locator('..').locator('..');
        const paint = () => marker.evaluate(node => {
          const active = getComputedStyle(node, '::after');
          return { content: active.content, outline: active.borderColor, center: active.backgroundImage };
        });
        const neutral = () => otherMarker.evaluate(node => getComputedStyle(node, '::after').content);

        await number.scrollIntoViewIfNeeded();
        await page.mouse.move(12, 48);
        const initial = Number(await slider.inputValue());
        const box = (await marker.boundingBox())!;
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await expect.poll(paint).toMatchObject({ content: '""', outline: accent });
        expect((await paint()).center).toContain(accent);
        await number.focus();
        await expect(values).toHaveCSS('outline-color', accent);
        await page.mouse.down();
        try {
          await page.mouse.move(x + direction * 50, y, { steps: 5 });
          await expect.poll(async () => Number(await slider.inputValue())).not.toBe(initial);
          await expect(number).toHaveValue(await slider.inputValue());
          await expect(values).toHaveCSS('outline-width', '2px');
          await expect(caption).toHaveCSS('color', accent);
          await expect.poll(paint).toMatchObject({ content: '""', outline: accent });
          await expect.poll(neutral).toBe('none');
          if (theme === 'dark' && panel && bound === 'min' && await field.getAttribute('data-report-range') === 'mau')
            await captureRange(field, 'range-mau-drag-dark.png');
        } finally {
          await page.mouse.up();
        }
        await page.mouse.move(12, 48);
        await expect(slider).toBeFocused();
        await expect(values).toHaveCSS('outline-color', accent);
        await expect(caption).toHaveCSS('color', accent);
        await expect.poll(paint).toMatchObject({ content: '""', outline: accent });
        if (theme === 'dark' && !panel && bound === 'max' && await field.getAttribute('data-report-range') === 'lastViewed')
          await captureRange(field, 'range-viewed-focus-dark.png');
        await slider.evaluate(element => (element as HTMLInputElement).blur());
        await expect(values).toHaveCSS('outline-style', 'none');
        await expect.poll(paint).toMatchObject({ content: 'none' });
      }
    }

    await page.getByRole('button', { name: 'Открыть фильтры отчётов', exact: true }).click();
    const panel = page.locator('[data-report-filter-panel]');
    for (const attribute of ['mau', 'lastViewed']) await checkRange(panel.locator(`[data-report-range="${attribute}"]`), true);
    await page.keyboard.press('Escape');
    for (const column of ['MAU', 'Просмотр']) {
      await page.getByRole('button', { name: `Фильтр «${column}»`, exact: true }).click();
      await checkRange(page.getByRole('dialog').locator('[data-report-range]'), false);
      await page.keyboard.press('Escape');
    }
  });
}
