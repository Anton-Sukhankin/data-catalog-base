import { expect, test, type Locator, type Page } from '@playwright/test';

const base = '/preview/navigation?';
test.use({ storageState: { cookies: [], origins: [] } });
const primary = 'rgb(0, 113, 235)';
const control = 'rgb(133, 138, 150)';
const selected = 'rgb(134, 184, 255)';
const darkSurface = 'rgb(55, 58, 64)';
const action = (scope: Page | Locator) => scope.getByRole('button', { name: 'Применить', exact: true });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto(base + 'section=reports');
  await expect(page.locator('html')).toHaveAttribute('data-catalog-theme', 'dark');
});

async function verifyListChoice(checkbox: Locator) {
  const visual = checkbox.locator('xpath=following-sibling::span');
  await expect(checkbox).not.toBeChecked();
  await expect(visual.locator('span')).toHaveCSS('border-color', control);
  await expect(visual.locator('span')).toHaveCSS('background-color', darkSurface);
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(visual.locator('img')).toBeVisible();
  await expect(visual).toHaveCSS('outline-color', 'rgb(207, 227, 255)');
  await expect(visual).toHaveCSS('outline-offset', '2px');
  await checkbox.press('Tab');
}

async function verifyApply(button: Locator) {
  await expect(button).toBeEnabled();
  await expect(button).toHaveCSS('background-color', primary);
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
}

test('dark column filters share checkbox and Apply states across the catalog', async ({ page }, info) => {
  for (const [route, trigger, label, option, evidence] of [
    ['section=reports', 'Фильтр «Домен»', 'Домен', 'Гостеприимство', 'report'],
    ['paginationDemo=0', 'Фильтр «Домен»', 'Домен', 'Гостеприимство', 'favorites'],
    ['section=sources&sourceView=list', 'Фильтр: Источник', 'Источник', 'SQL Server', 'sources'],
    ['section=ai&ai.view=list', 'Фильтр «Домен»', 'Домен', 'Операции', 'ai'],
  ]) {
    await test.step(evidence, async () => {
      await page.goto(base + route);
      await page.getByRole('button', { name: trigger, exact: true }).click();
      const menu = page.getByRole('dialog', { name: `Фильтр: ${label}`, exact: true });
      const apply = action(menu);
      if (evidence === 'sources') {
        await expect(apply).toBeDisabled();
        await expect(apply).toHaveCSS('background-color', 'rgb(38, 39, 43)');
      }
      await verifyListChoice(menu.getByRole('checkbox', { name: option, exact: true }));
      await verifyApply(apply);
      if (evidence === 'report') {
        await menu.screenshot({ path: info.outputPath('dark-column-filter-choice.png') });
        await apply.hover();
        await expect(apply).toHaveCSS('background-color', 'rgb(0, 100, 215)');
        await page.mouse.down();
        try {
          await expect(apply).toHaveCSS('background-color', 'rgb(0, 92, 196)');
        } finally {
          await page.mouse.up();
        }
      } else {
        await apply.click();
      }
      await expect(menu).toHaveCount(0);
    });
  }

  await page.goto(base + 'section=reports');
  await page.getByRole('button', { name: 'Тёмная тема', exact: true }).click();
  await page.getByRole('button', { name: 'Фильтр «Домен»', exact: true }).click();
  const lightMenu = page.getByRole('dialog', { name: 'Фильтр: Домен', exact: true });
  await expect(action(lightMenu)).toHaveCSS('background-color', 'rgba(0, 123, 252, 0.1)');
  const lightCheck = lightMenu.getByRole('checkbox', { name: 'Гостеприимство', exact: true });
  await expect(lightCheck.locator('xpath=following-sibling::span').locator('span')).toHaveCSS('border-color', 'rgb(210, 211, 215)');
});

test('dark catalog filter panels show enabled Apply only after editing the draft', async ({ page }, info) => {
  for (const [route, trigger, label, option, evidence] of [
    ['reports', 'Открыть фильтры отчётов', 'Домен', 'Гостеприимство', 'reports'],
    ['ai', 'Открыть фильтры AI Hub', 'Домен', 'Операции', 'ai'],
  ]) {
    await page.goto(base + 'section=' + route);
    await page.getByRole('button', { name: trigger, exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Фильтры', exact: true });
    const apply = action(panel);
    await expect(apply).toBeDisabled();
    await panel.getByRole('button', { name: new RegExp(`^${label} `) }).click();
    const list = panel.getByRole('dialog', { name: `Значения: ${label}` });
    await verifyListChoice(list.getByRole('checkbox', { name: option, exact: true }));
    await verifyApply(apply);
    if (evidence === 'reports') {
      await panel.screenshot({ path: info.outputPath('dark-report-panel-choice.png') });
    }
    await apply.focus();
    await expect(apply).toHaveCSS('outline-color', 'rgb(207, 227, 255)');
    await apply.press('Enter');
    await expect(panel).toHaveCount(0);
  }

  await page.goto(base + 'section=dictionary');
  await page.locator('[data-multi-select="domain"] [data-panel-field]').click();
  const list = page.getByRole('dialog', { name: 'Значения фильтра: Домен', exact: true });
  await verifyListChoice(list.getByRole('checkbox', { name: '10D SSA', exact: true }));
});

test('dark standalone controls match list choices in mailings and CRM', async ({ page }, info) => {
  const verifyFormChoice = async (checkbox: Locator) => {
    await checkbox.uncheck();
    await expect(checkbox).toHaveCSS('border-color', control);
    await expect(checkbox).toHaveCSS('background-color', darkSurface);
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toHaveCSS('background-color', selected);
  };
  await page.goto(base + 'section=reports&report=demo-report-sales-plan&reportTab=mailings');
  await page.getByRole('button', { name: 'Создать рассылку', exact: true }).click();
  const profile = page.getByRole('region', { name: 'Профиль РГП', exact: true });
  const latest = profile.getByRole('checkbox', { name: 'Последнее значение', exact: true });
  await verifyFormChoice(latest.first());
  await expect(latest.nth(1)).not.toBeChecked();
  await profile.screenshot({ path: info.outputPath('dark-mailing-profile-choice.png') });

  await page.getByRole('button', { name: 'Ручная отправка', exact: true }).click();
  const archive = page.getByRole('checkbox', { name: 'Архивировать', exact: true }).first();
  await verifyFormChoice(archive);
  const sheet = page.getByRole('checkbox', { name: /^Включить лист/ }).first();
  await verifyFormChoice(sheet);
  const radio = page.getByRole('radio').first();
  await expect(radio).toHaveCSS('border-width', '1px');
  const self = page.getByRole('switch', { name: /Почта.*себе/i }).first();
  await self.uncheck();
  await expect(self).toHaveCSS('background-color', darkSurface);
  await self.press('Space');
  await expect(self).toHaveCSS('background-color', selected);
  await page.getByRole('button', { name: /^Получатели почты/ }).click();
  const recipients = page.getByRole('dialog', { name: 'Получатели почты', exact: true });
  await verifyListChoice(recipients.getByRole('checkbox', { name: 'Анна Петрова', exact: true }));
  await verifyApply(action(recipients));
  await action(recipients).click();
  await expect(recipients).toHaveCount(0);

  await page.goto(base + 'section=systems&systems.reference=crm');
  const workspace = page.getByRole('region', { name: 'Справочник CRM' });
  await verifyFormChoice(workspace.getByRole('checkbox', { name: 'Без пагинации' }));
  const search = workspace.getByRole('region', { name: 'Панель поиска CRM' });
  const apply = action(search);
  await expect(apply).toBeDisabled();
  await search.getByRole('searchbox', { name: 'Поиск в справочнике CRM' }).fill('Продавец');
  await verifyApply(apply);
  await apply.click();
  await expect(workspace.getByRole('status')).toContainText('1');
});
