import { create } from 'zustand';
import type { ArticleCategory } from '@/components/news/ArticleCard';

export interface ExtendedArticle {
  id: string;
  category: ArticleCategory;
  title: string;
  timestamp: string;
  readTime: string;
  author: string;
  fullDate: string;
  body: string;
}

interface ArticleState {
  selectedArticle: ExtendedArticle | null;
  setSelectedArticle: (article: ExtendedArticle) => void;
  clearSelectedArticle: () => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  selectedArticle: null,
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  clearSelectedArticle: () => set({ selectedArticle: null }),
}));
