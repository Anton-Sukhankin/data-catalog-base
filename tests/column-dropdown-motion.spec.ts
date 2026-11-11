import { expect, test } from '@playwright/test';

const cases = [
  { section: 'reports', route: 'section=reports&tableCase=single-page', trigger: 'Фильтр «Домен»', label: 'Домен', option: 'Гостеприимство' },
  { section: 'favorites', route: 'paginationDemo=0', trigger: 'Фильтр «Домен»', label: 'Домен', option: 'Гостеприимство' },
  { section: 'sources', route: 'section=sources&sourceView=list', trigger: 'Фильтр: Источник', label: 'Источник', option: 'SQL Server' },
  { section: 'AI Hub', route: 'section=ai&ai.view=list', trigger: 'Фильтр «Домен»', label: 'Домен', option: 'Операции' },
];

for (const { section, route, trigger, label, option } of cases) {
  test(`${section} column filters fade out on a second click and keep applied values`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(`/preview/navigation?${route}`);
    const heading = page.getByRole('button', { name: trigger, exact: true });
    const menu = page.getByRole('dialog', { name: `Фильтр: ${label}`, exact: true });
    const surface = page.locator('[data-column-dropdown-motion]');
    const checkbox = menu.getByRole('checkbox', { name: option, exact: true });
    const icon = heading.locator('..').locator(':scope > img').first();
    const clickIcon = async () => {
      const { x, y, width, height } = (await icon.boundingBox())!;
      await page.mouse.click(x + width / 2, y + height / 2);
    };
    await page.evaluate(() => {
      document.addEventListener('animationstart', event => {
        if (event.animationName !== 'catalog-column-dropdown-exit' || !(event.target instanceof HTMLElement)) return;
        document.documentElement.dataset.columnDropdownExit = event.target.inert ? 'inert' : 'interactive';
      });
    });

    await heading.click();
    await expect(heading).toHaveAttribute('aria-expanded', 'true');
    await expect(surface).toHaveCSS('animation-name', 'catalog-dropdown-enter');
    await expect(surface).toHaveCSS('animation-duration', '0.18s');
    await checkbox.check();
    await clickIcon();
    await expect(heading).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-column-dropdown-exit', 'inert');
    await expect(surface).toHaveCount(0);

    await heading.click();
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await menu.getByRole('button', { name: 'Применить', exact: true }).click();
    await expect(menu).toHaveCount(0);
    await heading.click();
    await expect(checkbox).toBeChecked();
    await clickIcon();
    await expect(heading).toHaveAttribute('aria-expanded', 'false');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await heading.press('Enter');
    await expect(checkbox).toBeChecked();
    await expect(surface).toHaveCSS('animation-name', 'none');
    await heading.press('Enter');
    await expect(surface).toHaveCount(0);
  });
}
