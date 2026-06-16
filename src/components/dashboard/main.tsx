"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import {
  type Bookmark,
  type Collection,
  type Tag,
  useBookmarksStore,
} from "@/store/bookmarks-store";
import { BookmarksContent } from "./content";
import { BookmarksHeader } from "./header";
import { BookmarksSidebar } from "./sidebar";

interface DashboardMainProps {
  initialData: {
    bookmarks: Bookmark[];
    collections: Collection[];
    tags: Tag[];
  };
}

export function DashboardMain({ initialData }: DashboardMainProps) {
  const setInitialData = useBookmarksStore((state) => state.setInitialData);
  const isInitialized = useBookmarksStore(
    (state) => state.bookmarks.length > 0,
  );

  // Initialize during render to avoid useEffect delay and hydration issues
  if (!isInitialized) {
    setInitialData(initialData);
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <BookmarksSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <BookmarksHeader />
          <BookmarksContent />
        </div>
      </div>
    </SidebarProvider>
  );
}
