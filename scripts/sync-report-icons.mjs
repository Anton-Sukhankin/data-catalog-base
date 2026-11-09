import { readFile, writeFile } from 'node:fs/promises';

// The unchanged navigation asset owns report geometry. Derived files only vary
// size, state color and the table's existing circular background.
const publicRoot = new URL('../public/',import.meta.url);
const source = await readFile(new URL('icons/sidebar/reports.svg',publicRoot),'utf8');
const paths = source.match(/<path\b[^>]*\/>/g);
if (paths?.length !== 2 || !source.includes('viewBox="0 0 18 18"')) throw new Error('Review the changed navigation report master before regenerating');
function glyph(color) { return paths.map(path=>path.replace(/stroke="#[A-Fa-f0-9]+"/g,`stroke="${color}"`)).join('\n'); }
function icon(color) { return `<svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">\n${glyph(color)}\n</svg>\n`; }
function circle(color,background) {
  return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">\n<rect width="40" height="40" rx="20" fill="${background}"/>\n<svg x="12" y="12" width="16" height="16" viewBox="0 0 18 18" fill="none">\n${glyph(color)}\n</svg>\n</svg>\n`;
}
const files = {
  'icons/reports/report-document.svg':icon('#7186A5'),
  'icons/reports/report-document-hover.svg':icon('#0067DC'),
  'icons/search/group-report.svg':icon('#101D3B'),
  'images/report-table/document-default.svg':circle('#7186A5','#EEF2F6'),
  'images/report-table/document-hover.svg':circle('#0067DC','#E7F2FF'),
};
for (const [path,svg] of Object.entries(files)) await writeFile(new URL(path,publicRoot),svg);
console.log(`Generated ${Object.keys(files).length} report icon variants from the navigation master`);
