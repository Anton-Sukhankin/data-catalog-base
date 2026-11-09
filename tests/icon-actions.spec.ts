import {expect,test} from '@playwright/test';

test('edit and bookmark controls share one circular border and blue hover without moving',async({page})=>{
  const routes=[
    '?section=reports','?section=reports&report=demo-report-summary',
    '?section=metrics&metricView=cards','?section=metrics&metricView=list',
    '?section=metrics&metric=4',
    '?section=sources&source=source-reportcrm-date',
    '?section=reports&report=demo-report-summary&reportTab=metrics&relatedMetricView=cards',
    '?section=reports&report=demo-report-summary&reportTab=metrics&relatedMetricView=list',
  ];
  await page.setViewportSize({width:1440,height:900});
  for(const route of routes){
    await page.goto('/preview/navigation'+route);
    const controls=page.locator('[data-round-action]');await expect(controls.first()).toBeVisible();
    const kinds=await controls.evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('data-round-action')))]);
    for(const kind of kinds){
      const button=controls.filter({has:page.locator('span')}).and(page.locator('[data-round-action="'+kind+'"]')).first();
      await button.scrollIntoViewIfNeeded();await page.mouse.move(5,5);
      await expect(button).toHaveCSS('border-top-color','rgb(215, 230, 245)');
      await expect(button).toHaveCSS('border-radius','50%');
      const before=(await button.boundingBox())!;expect(before.width).toBe(32);expect(before.height).toBe(32);
      await expect(button.locator('span')).toHaveCSS('width','16px');
      await expect(button.locator('span')).toHaveCSS('height','16px');
      await button.hover();await expect(button).toHaveCSS('border-top-color','rgb(0, 103, 220)');
      await expect(button.locator('span')).toHaveCSS('background-color','rgb(0, 103, 220)');
      expect(await button.boundingBox()).toEqual(before);
    }
  }
});

test('breadcrumbs and the news list button preserve originating lists',async({page})=>{
  await page.goto('/preview/navigation?section=reports');
  await page.getByRole('combobox',{name:'Поиск по каталогу'}).fill('Сводный');
  await page.getByRole('button',{name:'Открыть паспорт «Сводный отчёт Гостеприимства»',exact:true}).click();
  await expect(page.locator('[data-round-action="back"]')).toHaveCount(0);
  await page.getByRole('navigation',{name:'Хлебные крошки',exact:true}).getByRole('button',{name:'Отчёты',exact:true}).press('Enter');
  await expect(page).toHaveURL(/section=reports$/);
  await page.goto('/preview/navigation?section=metrics&metricView=cards&metricType=Показатель&metricStatus=Проверена');
  await page.getByRole('button',{name:'Объём продаж',exact:true}).click();
  await expect(page.locator('[data-round-action="back"]')).toHaveCount(0);
  await page.getByRole('navigation',{name:'Хлебные крошки',exact:true}).getByRole('button',{name:'Метрики и показатели',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Статус метрики',exact:true})).toHaveText('Проверена');
  await expect(page.getByRole('button',{name:'Карточный вид',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.goto('/preview/navigation?section=home&tab=news&category=important');
  const list=page.getByRole('region',{name:'Список новостей',exact:true});
  await list.locator('[data-news-id]').first().getByRole('button',{name:/^Читать/}).click();
  const allNews = page.getByRole('article').locator('header').getByRole('button',{name:'Все новости',exact:true});
  await expect(allNews).toHaveAttribute('data-round-action','chevron');
  await allNews.press('Enter');
  await expect(list.locator('[data-news-id]')).toHaveCount(4);
  await expect(page).toHaveURL(/category=important/);
});
