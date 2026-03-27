"use client";

import { Search, Tag } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBookmarksStore } from "@/store/bookmarks-store";

export function BookmarksSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { selectedTags, toggleTag, tags, searchQuery, setSearchQuery } =
    useBookmarksStore();

  return (
    <Sidebar collapsible="offcanvas" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="p-5 pb-0">
        <div className="flex items-center justify-end">
          <Avatar className="size-6.5">
            <AvatarImage src="/logo.png" />
            <AvatarFallback />
          </Avatar>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-5 pt-5">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search Sites..."
            className="pl-9 pr-10 h-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground font-medium">
            ⌘K
          </div>
        </div>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : tag.color
                  )}
                >
                  <Tag className="size-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
