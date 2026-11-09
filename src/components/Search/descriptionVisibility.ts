import { searchOffsets, type SearchHit } from '../../data/catalogSearch';

export function isDescriptionMatchClipped(element: HTMLElement, hit: SearchHit, maxLines?: number) {
  if (!element.clientWidth || !element.clientHeight) return false;
  const style = getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const visibleHeight = maxLines ? maxLines * lineHeight : element.clientHeight;

  const horizontalOverflow = element.scrollWidth > element.clientWidth;
  const verticalOverflow = element.scrollHeight > visibleHeight + 1;
  if (!horizontalOverflow && !verticalOverflow) return false;

  const range = document.createRange();
  const mark = element.querySelector('[data-catalog-search-match]');
  if (mark) {
    range.selectNodeContents(mark);
  } else {
    const text = element.firstChild;
    if (!(text instanceof Text)) return false;
    const start = searchOffsets(text.data, hit.query)[hit.occurrence ?? 0];
    if (start === undefined) return false;
    range.setStart(text, start);
    range.setEnd(text, start + hit.query.length);
  }
  const bounds = element.getBoundingClientRect();
  const bottom = maxLines ? bounds.top + visibleHeight : bounds.bottom;
  const canvas = document.createElement('canvas').getContext('2d');
  if (canvas) canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const ellipsisWidth = canvas?.measureText('…').width ?? 0;
  return Array.from(range.getClientRects()).some(rect => {
    const lastLine = horizontalOverflow || rect.top >= bottom - lineHeight - 1;
    const visibleRight = bounds.right - (lastLine ? ellipsisWidth : 0);
    return rect.bottom > bottom + 1 || rect.right > visibleRight + 1;
  });
}
