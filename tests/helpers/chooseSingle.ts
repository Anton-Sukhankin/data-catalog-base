import { expect, type Locator, type Page } from '@playwright/test';

export async function chooseSingle(page:Page,control:Locator,label:string) {
  await control.click();
  await page.getByRole('listbox').getByRole('option',{name:label,exact:true}).click();
  await expect(control).toHaveText(label);
}
