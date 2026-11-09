import { describe, expect, it } from 'vitest';
import { packTags } from './packTags';

describe('selected tag packing', () => {
  it('shows all values without a counter when they fit, including the exact boundary', () => {
    expect(packTags(158, [50, 50, 50], [0, 28, 28, 28])).toEqual({ visibleCount: 3, lastWidth: 50 });
  });
  it('reserves the overflow counter by shortening the preceding visible tag', () => {
    expect(packTags(122, [50, 50, 50], [0, 28, 28, 28])).toEqual({ visibleCount: 2, lastWidth: 36 });
  });
  it('keeps a single long value as one truncated tag without inventing hidden values', () => {
    expect(packTags(164, [300], [0, 28])).toEqual({ visibleCount: 1, lastWidth: 164 });
  });
  it('preserves the first selected item when it alone exceeds the available width', () => {
    expect(packTags(164, [300, 80], [0, 28, 28])).toEqual({ visibleCount: 1, lastWidth: 132 });
  });
  it('recalculates counter width when the hidden count has two digits and handles clearing', () => {
    expect(packTags(140, Array.from({ length: 12 }, () => 100), [0, ...Array.from({ length: 9 }, () => 28), 36, 36, 36])).toEqual({ visibleCount: 1, lastWidth: 100 });
    expect(packTags(140, [], [0])).toEqual({ visibleCount: 0, lastWidth: 0 });
  });
});
