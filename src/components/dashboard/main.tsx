"use client";

import * as React from "react";
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
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setInitialData(initialData);
    setInitialized(true);
  }, [initialData, setInitialData]);

  if (!initialized) return null;

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
