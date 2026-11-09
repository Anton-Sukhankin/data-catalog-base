/** UI values supplied by the caller; these are not a publication API schema. */
export interface NewsSummary {
  id: string;
  label: 'Новое' | 'Важно' | 'Изменение';
  title: string;
  summary: string;
  dateLabel: string;
  dateTime: string;
  imageSrc: string;
}

export interface NewsCardProps {
  news: NewsSummary;
  onRead: (newsId: string) => void;
}

export interface NewsListProps {
  items: readonly NewsSummary[];
  onRead: (newsId: string) => void;
}

export type NewsCategoryId = 'all' | 'new' | 'important' | 'changes';

export interface NewsArticleBlock {
  kind: 'paragraph' | 'heading';
  text: string;
}

export interface NewsArticle extends NewsSummary {
  navigationDateLabel: string;
  heroSrc: string;
  blocks: readonly NewsArticleBlock[];
  /** Provenance of the local fixture; never a publication/read-unread status. */
  contentSource: 'figma' | 'demo';
}

export interface NewsContentProps {
  category: NewsCategoryId;
  /** Caller supplies the current category in its intended navigation order. */
  items: readonly NewsArticle[];
  currentNewsId?: string;
  onRead: (newsId: string) => void;
  onBack: () => void;
  onChangeArticle: (newsId: string) => void;
  pageIndex?: number;
  onPageChange: (index: number) => void;
  listScrollTop?: number;
  onListScroll?: (scrollTop: number) => void;
  listViewportOffset?: number;
  readingViewportOffset?: number;
}
