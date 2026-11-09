import { describe, expect, it } from 'vitest';
import { filterValueListHeight, placePanelValueList } from './filterPanelPosition';

describe('agreed panel popup placement', () => {
  it('keeps the eight pixel gap, flips upward when needed, and contains the right edge', () => {
    expect(placePanelValueList({ left: 956, top: 136, bottom: 176 }, 440, 344, { width: 1440, height: 900 })).toEqual({ left: 956, top: 184 });
    expect(placePanelValueList({ left: 956, top: 536, bottom: 576 }, 212, 344, { width: 1440, height: 900 })).toEqual({ left: 956, top: 184 });
    expect(placePanelValueList({ left: 1300, top: 136, bottom: 176 }, 212, 128, { width: 1440, height: 900 })).toEqual({ left: 1228, top: 184 });
  });
  it('limits long lists to seven whole rows and preserves compact natural heights', () => {
    expect(filterValueListHeight(9, true)).toBe(344);
    expect(filterValueListHeight(5, false)).toBe(208);
    expect(filterValueListHeight(3, false)).toBe(128);
  });
});
