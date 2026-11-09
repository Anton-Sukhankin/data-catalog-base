import { createContext, useContext } from 'react';
import { searchOffsets, type SearchHit } from '../../data/catalogSearch';
import styles from './SearchMatch.module.css';

export const SearchLandingContext = createContext<(SearchHit & { highlightDismissed?: boolean }) | undefined>(undefined);

export function MatchedText({ text, query, landing = false, occurrence = 0 }: { text: string; query: string; landing?: boolean; occurrence?: number }) {
  const index = searchOffsets(text, query)[occurrence];
  if (index === undefined) return <>{text}</>;
  const end = index + query.length;
  return <>{text.slice(0, index)}<mark className={landing ? styles.landing : undefined}
    data-catalog-search-match={landing || undefined}>{text.slice(index, end)}</mark>{text.slice(end)}</>;
}

export function SearchTargetText({ id, field, text, useMatchedValue = false }: {
  id: string; field: string; text: string; useMatchedValue?: boolean;
}) {
  const hit = useContext(SearchLandingContext);
  if (!hit || hit.highlightDismissed || hit.entry.id !== id || hit.value.field !== field) return <>{text}</>;
  const occurrence = hit.occurrence ?? 0;
  const visible = useMatchedValue && searchOffsets(text, hit.query)[occurrence] === undefined ? hit.value.text : text;
  return <MatchedText text={visible} query={hit.query} occurrence={occurrence} landing />;
}
