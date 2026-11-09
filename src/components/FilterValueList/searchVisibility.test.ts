import { expect, test } from 'vitest';
import { shouldShowFilterSearch } from './searchVisibility';

test('multiple-choice search starts at seven complete options', () => {
  expect(shouldShowFilterSearch(0)).toBe(false);
  expect(shouldShowFilterSearch(6)).toBe(false);
  expect(shouldShowFilterSearch(7)).toBe(true);
  expect(shouldShowFilterSearch(8)).toBe(true);
});
test('explicit context restrictions and single-choice search remain with the caller', () => {
  expect(shouldShowFilterSearch(8, 'multiple', false)).toBe(false);
  expect(shouldShowFilterSearch(2, 'single', true)).toBe(true);
  expect(shouldShowFilterSearch(2, 'single', false)).toBe(false);
});
