import { expect, test } from '@playwright/test';

const preview = '/preview/navigation';

test('report filters still recover a result after the table has no matches', async ({ page }) => {
  await page.goto(preview + '?section=reports');
  const dialog = page.getByRole('dialog');
  for (const [field, value] of [['Домен', 'Финансы'], ['Мастер-система', 'Домиленд']]) {
    await page.getByRole('button', { name: `Фильтр «${field}»`, exact: true }).click();
    await dialog.getByRole('checkbox', { name: value, exact: true }).check();
    await dialog.getByRole('button', { name: 'Применить', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Отчёты не найдены' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Список отчётов' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Табличный вид' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Открыть фильтры отчётов' })).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Список отчётов' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Табличный вид' })).toBeVisible();
});

test('empty favorites and unavailable report metrics hide result controls', async ({ page }) => {
  await page.goto(preview + '?segment=favorites&homeCase=empty-favorites');
  await expect(page.getByRole('heading', { name: 'В избранном пока нет отчётов' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Табличный вид' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Открыть фильтры отчётов' })).toHaveCount(0);

  await page.goto(preview + '?section=reports&report=demo-report-management&reportTab=metrics');
  await expect(page.getByRole('heading', { name: 'Сведения о показателях недоступны' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Поиск метрик/ })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Тип метрики' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Карточный вид' })).toHaveCount(0);

  await page.goto(preview + '?section=reports&report=demo-report-summary&reportTab=metrics');
  const search = page.getByRole('textbox', { name: /Поиск метрик/ });
  await search.fill('неттакойметрики927');
  await expect(page.getByRole('heading', { name: 'По заданным условиям показатели не найдены' })).toBeVisible();
  await expect(search).toBeVisible();
  await expect(page.getByRole('button', { name: 'Карточный вид' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Сбросить условия' }).click();
  await expect(page.getByRole('table', { name: 'Связанные показатели' })).toBeVisible();
});

test('CRM clears applied and draft filters from zero results with the search panel hidden', async ({ page }) => {
  await page.goto(preview + '?section=systems&systems.reference=crm');
  await page.getByRole('searchbox', { name: 'Поиск в справочнике CRM' }).fill('неттакойзаписи927');
  await page.getByRole('button', { name: 'Применить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'По выбранным условиям ничего не найдено.' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Без пагинации' })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Скрыть поиск' }).click();
  await expect(page.getByRole('button', { name: 'Показать поиск' })).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить условия' }).click();
  await expect(page.getByRole('status')).toContainText('Найдено 18 записей');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Показать поиск' }).click();
  await expect(page.getByRole('searchbox', { name: 'Поиск в справочнике CRM' })).toHaveValue('');
});
