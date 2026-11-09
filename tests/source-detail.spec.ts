import {test,expect} from '@playwright/test';
const id='source-demo-rewedo-versions';
const name='rewedo_crm_production.public.versions';
const entry='/preview/navigation?section=sources';
const detail=entry+'&source='+id;

test('sidebar opens the source catalog instead of reopening the last source', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Разделы каталога' });
  const sourceSection = nav.getByRole('button', { name: 'Источники', exact: true });
  const card = page.locator('[data-source-detail-id]');
  for (const view of ['default', 'cards']) {
    await page.goto(view === 'cards' ? entry + '&sourceView=cards' : entry);
    await page.locator('[data-source-id]').getByRole('button', { name, exact: true }).click();
    await expect(card).toHaveAttribute('data-source-detail-id', id);
    await nav.getByRole('button', { name: 'Главная', exact: true }).click();
    await expect(page).toHaveURL(/[?&]section=home/);
    await expect(page).not.toHaveURL(/[?&]source(?:Tab|Report)?=/);
    await sourceSection.click();
    await expect(page).toHaveURL(new URL(entry, page.url()).toString());
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Табличный вид', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
});

test('both source catalog views open the matching detail and retain conditions through history and return',async({page})=>{
  for(const view of ['list','cards']) {
    await page.goto(entry+'&sourceView='+view+'&source.platform=PostgreSQL&sourcePage=0');
    const origin=page.url();
    await expect(page.locator('[data-source-id]')).toHaveCount(1);
    await page.locator('[data-source-id]').getByRole('button',{name,exact:true}).click();
    await expect(page.locator('[data-source-detail-id]')).toHaveAttribute('data-source-detail-id',id);
    await expect(page.getByRole('heading',{level:1,name,exact:true})).toBeVisible();
    await page.getByRole('tab',{name:'Связанные отчёты 0',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Связанные отчёты не найдены',exact:true})).toBeVisible();
    await page.reload();
    await expect(page.getByRole('tab',{name:'Связанные отчёты 0',exact:true})).toHaveAttribute('aria-selected','true');
    await page.goBack();
    await expect(page).toHaveURL(origin);
    await page.goForward();
    await expect(page.locator('[data-source-detail-id]')).toHaveAttribute('data-source-detail-id',id);
    await page.locator('[data-source-detail-id] nav').getByRole('button',{name:'Источники',exact:true}).click();
    await expect(page).toHaveURL(origin);
    await expect(page.getByRole('button',{name:view==='cards'?'Карточный вид':'Табличный вид',exact:true})).toHaveAttribute('aria-pressed','true');
  }
});

test('source fields preserve known metadata in a complete schema, unknown counts and independent disclosure',async({page})=>{
  await page.goto(detail);
  const root=page.locator('[data-source-detail-id]');
  const fields=page.getByRole('region',{name:'Описание полей источника',exact:true});
  await expect(fields.locator('section')).toHaveCount(8);
  await expect(page.getByRole('tab',{name:'Описание полей 8',exact:true})).toHaveAttribute('aria-selected','true');
  const first=fields.locator('section').nth(0),second=fields.locator('section').nth(1),unknown=fields.locator('section').nth(3);
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded','false');
  await first.getByRole('button').press('Enter');
  await expect(first.getByText('Связанные метрики не найдены', {exact:true})).toBeVisible();
  await second.getByRole('button').press('Space');
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded','true');
  await expect(second.getByRole('button')).toHaveAttribute('aria-expanded','true');
  await unknown.getByRole('button').click();
  await expect(unknown.getByText('Сведения о связанных метриках не предоставлены',{exact:true})).toBeVisible();
  await expect(unknown.getByText('Метрики', {exact:true})).toHaveCount(0);
  await expect(first.getByText('Метрики', {exact:true})).toHaveCount(0);
  await expect(root.locator('[data-tone=red]').first()).toHaveCSS('background-color','rgb(255, 234, 231)');
  await expect(root.locator('[data-tone=purple]').first()).toHaveCSS('color','rgb(89, 50, 169)');
  await expect(root.locator('[data-tone=yellow]').first()).toHaveCSS('background-color','rgb(255, 249, 229)');
  await expect(root.getByRole('button',{name:/^Об источнике/})).toHaveAttribute('aria-expanded','true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await first.getByRole('button').click();
  await expect(first.getByRole('button')).toHaveAttribute('aria-expanded','false');
});

test('source actions have honest boundaries and the unselected bookmark is an enabled local toggle',async({page})=>{
  await page.goto(detail);
  const bookmark=page.getByRole('button',{name:'Закладка источника',exact:true});
  await expect(bookmark).toHaveAttribute('aria-pressed','false');
  await expect(bookmark).toBeEnabled();
  await expect(bookmark).toHaveCSS('background-color','rgb(255, 255, 255)');
  await bookmark.click();await expect(bookmark).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Скачать метаданные',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Файл не создан');
  await page.getByRole('button',{name:'Получить доступ',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Заявка не отправлена');
  await page.getByRole('tab',{name:'Lineage',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Содержимое этой вкладки не предоставлено');
  await expect(page.getByRole('tab',{name:'Описание полей 8',exact:true})).toHaveAttribute('aria-selected','true');
  await page.reload();await expect(bookmark).toHaveAttribute('aria-pressed','false');
});

test('direct, missing and other source IDs never inherit the reference passport',async({page})=>{
  await page.goto(detail+'&sourceTab=reports');
  await page.locator('[data-source-detail-id] nav').getByRole('button',{name:'Источники',exact:true}).click();
  await expect(page.locator('[data-source-id]')).toHaveCount(9);
  await page.goto(entry+'&source=unknown');
  await expect(page.getByRole('heading',{name:'Источник не найден',exact:true})).toBeVisible();
  await page.goto(entry+'&source=source-reportcrm-date');
  await expect(page.getByRole('heading',{level:1,name:'reportcrm20.dbo.dimdate',exact:true})).toBeVisible();
  await expect(page.getByText('Ручнов Константин Михайлович',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Описание полей источника',exact:true}).locator('section')).toHaveCount(34);
  const rows = page.getByRole('region',{name:'Описание полей источника',exact:true}).locator('section');
  await expect(rows.nth(0).getByRole('button')).toContainText(/Метрики\s*3/);
  await expect(rows.nth(1).getByText('Метрики',{exact:true})).toHaveCount(0);
  await expect(rows.nth(2).getByRole('button')).toContainText(/Метрики\s*1/);
  for (const [index, count] of [[0, 3], [2, 1]]) {
    const row = rows.nth(index);
    await row.getByRole('button').click();
    await expect(row.getByRole('list', {name:'Связанные метрики'}).getByRole('listitem')).toHaveCount(count);
  }
  await expect(page.getByText('Сведения о полях этого источника не предоставлены.',{exact:true})).toHaveCount(0);
  await page.getByRole('tab',{name:'Связанные отчёты 84',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Список связанных отчётов недоступен',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Связанные отчёты не найдены',exact:true})).toHaveCount(0);
});

const sourceSchemas = [
  ['source-reportcrm-date','reportcrm20.dbo.dimdate',34,'date_key','created_at'],
  ['source-dwh-date','dwh2crm.ref.dimdate',33,'date_key','source_system'],
  ['source-dwh-project','dwh2crm.tableau.проект',20,'project_id','etl_loaded_at'],
  ['source-demo-clients','demo.crm.clients',12,'client_id','updated_at'],
  ['source-demo-contracts','demo.crm.contracts',18,'contract_id','updated_at'],
  ['source-demo-sales','demo.crm.sales',24,'sale_id','updated_at'],
  ['source-demo-requests','demo.service.requests',15,'request_id','sla_breached'],
  ['source-demo-feedback','demo.service.feedback',10,'feedback_id','processed_at'],
  [id,name,8,'id','object_changes'],
] as const;
for(const view of ['list','cards']) test(`every source opens its own full accordion schema from ${view} and returns to the same list`,async({page})=>{
  test.setTimeout(60000);
  const failures:string[]=[];page.on('pageerror',error=>failures.push(error.message));
  await page.goto(entry+'&sourceView='+view);
  for(const [sourceId,title,count,firstField,lastField] of sourceSchemas) {
    await page.locator(`[data-source-id="${sourceId}"]`).getByRole('button',{name:title,exact:true}).click();
    await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
    const passport=page.getByRole('complementary',{name:'Сведения об источнике',exact:true});
    await expect(passport).not.toContainText('—');
    await expect(passport).not.toContainText('Не указан');
    await expect(page.getByText('Описание отсутствует',{exact:true})).toHaveCount(0);
    const fields=page.getByRole('region',{name:'Описание полей источника',exact:true});
    await expect(fields.locator('section')).toHaveCount(count);
    await expect(page.getByRole('tab',{name:`Описание полей ${count}`,exact:true})).toHaveAttribute('aria-selected','true');
    await expect(fields.locator('section').first().getByRole('button')).toContainText(firstField);
    const last=fields.locator('section').last();
    await expect(last.getByRole('button')).toContainText(lastField);
    await last.getByRole('button').click();
    await expect(last.getByRole('button')).toHaveAttribute('aria-expanded','true');
    await expect(fields.getByText('Сведения о полях этого источника не предоставлены.',{exact:true})).toHaveCount(0);
    await page.locator('[data-source-detail-id] [data-detail-scroll]').evaluate(el => { el.scrollTop = 0; });
    await page.locator('[data-source-detail-id] nav').getByRole('button',{name:'Источники',exact:true}).click();
    await expect(page).toHaveURL(entry+'&sourceView='+view);
  }
  expect(failures).toEqual([]);
});
