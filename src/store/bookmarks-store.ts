import { create } from "zustand";

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  collectionId: string;
  tags: string[];
  createdAt: string;
  isFavorite: boolean;
  hasDarkIcon?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  count: number;
};

type ViewMode = "grid" | "list";
type SortBy = "date-newest" | "date-oldest" | "alpha-az" | "alpha-za";
type FilterType = "all" | "favorites" | "with-tags" | "without-tags";
export type MainView = "all" | "favorites" | "archive" | "trash";

interface BookmarksState {
  bookmarks: Bookmark[];
  archivedBookmarks: Bookmark[];
  trashedBookmarks: Bookmark[];
  currentView: MainView;
  selectedCollection: string;
  selectedTags: string[];
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  filterType: FilterType;
  collections: Collection[];
  tags: Tag[];

  setInitialData: (data: {
    bookmarks: Bookmark[];
    collections: Collection[];
    tags: Tag[];
  }) => void;
  setCurrentView: (view: MainView) => void;
  setSelectedCollection: (collectionId: string) => void;
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortBy) => void;
  setFilterType: (filter: FilterType) => void;
  toggleFavorite: (bookmarkId: string) => void;
  archiveBookmark: (bookmarkId: string) => void;
  restoreFromArchive: (bookmarkId: string) => void;
  trashBookmark: (bookmarkId: string) => void;
  restoreFromTrash: (bookmarkId: string) => void;
  permanentlyDelete: (bookmarkId: string) => void;
  getFilteredBookmarks: () => Bookmark[];
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  archivedBookmarks: [],
  trashedBookmarks: [],
  currentView: "all",
  selectedCollection: "all",
  selectedTags: [],
  searchQuery: "",
  viewMode: "grid",
  sortBy: "date-newest",
  filterType: "all",
  collections: [],
  tags: [],

  setInitialData: (data) =>
    set({
      bookmarks: data.bookmarks,
      collections: data.collections,
      tags: data.tags,
    }),

  setCurrentView: (view) =>
    set({ currentView: view, selectedCollection: "all", selectedTags: [] }),
  setSelectedCollection: (collectionId) =>
    set({ selectedCollection: collectionId, currentView: "all" }),
  toggleTag: (tagId) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tagId)
        ? state.selectedTags.filter((t) => t !== tagId)
        : [...state.selectedTags, tagId],
    })),
  clearTags: () => set({ selectedTags: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setFilterType: (filter) => set({ filterType: filter }),
  toggleFavorite: (bookmarkId) =>
    set((state) => ({
      bookmarks: state.bookmarks.map((bookmark) =>
        bookmark.id === bookmarkId
          ? { ...bookmark, isFavorite: !bookmark.isFavorite }
          : bookmark
      ),
    })),
  archiveBookmark: (bookmarkId) =>
    set((state) => {
      const bookmark = state.bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return state;
      return {
        bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
        archivedBookmarks: [...state.archivedBookmarks, bookmark],
      };
    }),
  restoreFromArchive: (bookmarkId) =>
    set((state) => {
      const bookmark = state.archivedBookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return state;
      return {
        archivedBookmarks: state.archivedBookmarks.filter(
          (b) => b.id !== bookmarkId
        ),
        bookmarks: [...state.bookmarks, bookmark],
      };
    }),
  trashBookmark: (bookmarkId) =>
    set((state) => {
      const bookmark = state.bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return state;
      return {
        bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
        trashedBookmarks: [...state.trashedBookmarks, bookmark],
      };
    }),
  restoreFromTrash: (bookmarkId) =>
    set((state) => {
      const bookmark = state.trashedBookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return state;
      return {
        trashedBookmarks: state.trashedBookmarks.filter(
          (b) => b.id !== bookmarkId
        ),
        bookmarks: [...state.bookmarks, bookmark],
      };
    }),
  permanentlyDelete: (bookmarkId) =>
    set((state) => ({
      trashedBookmarks: state.trashedBookmarks.filter(
        (b) => b.id !== bookmarkId
      ),
    })),
  getFilteredBookmarks: () => {
    const state = get();
    let source = state.bookmarks;
    if (state.currentView === "favorites")
      source = state.bookmarks.filter((b) => b.isFavorite);
    else if (state.currentView === "archive") source = state.archivedBookmarks;
    else if (state.currentView === "trash") source = state.trashedBookmarks;

    let filtered = [...source];
    if (state.selectedCollection !== "all") {
      filtered = filtered.filter(
        (b) => b.collectionId === state.selectedCollection
      );
    }
    if (state.selectedTags.length > 0) {
      filtered = filtered.filter((b) =>
        state.selectedTags.some((tag) => b.tags.includes(tag))
      );
    }
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    if (state.currentView === "all") {
      switch (state.filterType) {
        case "favorites":
          filtered = filtered.filter((b) => b.isFavorite);
          break;
        case "with-tags":
          filtered = filtered.filter((b) => b.tags.length > 0);
          break;
        case "without-tags":
          filtered = filtered.filter((b) => b.tags.length === 0);
          break;
      }
    }

    switch (state.sortBy) {
      case "date-newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "date-oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "alpha-az":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-za":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    return filtered;
  },
}));
