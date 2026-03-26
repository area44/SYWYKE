"use client";

import { ChevronDown, Globe, Search, Tag } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBookmarksStore } from "@/store/bookmarks-store";

export function BookmarksSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [tagsOpen, setTagsOpen] = React.useState(true);
  const {
    selectedTags,
    toggleTag,
    clearTags,
    tags,
    searchQuery,
    setSearchQuery,
  } = useBookmarksStore();

  return (
    <Sidebar collapsible="offcanvas" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="p-5 pb-0">
        <div className="flex items-center justify-end">
          <Avatar className="size-6.5">
            <AvatarImage src="/logo.png" />
            <AvatarFallback>SY</AvatarFallback>
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
          <SidebarGroupLabel className="flex items-center gap-1.5 px-0 text-[10px] font-semibold tracking-wider text-muted-foreground">
            <button
              type="button"
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  !tagsOpen && "-rotate-90"
                )}
              />
              TAGS
            </button>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearTags();
                }}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </SidebarGroupLabel>
          {tagsOpen && (
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
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-5 pb-5">
        <a
          href="https://github.com/AREA44/SYWYKE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-border bg-background hover:bg-muted shadow-xs text-sm font-medium w-full"
        >
          <Globe className="size-4" />
          sywyke.vercel.app
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
