"use client";

import {
  Archive,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Folder,
  Globe,
  LogOut,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Tag,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type MainView, useBookmarksStore } from "@/store/bookmarks-store";

const collectionIcons: Record<string, React.ElementType> = {
  bookmark: Bookmark,
  palette: Palette,
  code: Code,
  wrench: Wrench,
  "book-open": BookOpen,
  sparkles: Sparkles,
};

const navItems: { icon: React.ElementType; label: string; id: MainView }[] = [
  { icon: Star, label: "Favorites", id: "favorites" },
  { icon: Archive, label: "Archive", id: "archive" },
  { icon: Trash2, label: "Trash", id: "trash" },
];

export function BookmarksSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [collectionsOpen, setCollectionsOpen] = React.useState(true);
  const [tagsOpen, setTagsOpen] = React.useState(true);
  const {
    currentView,
    setCurrentView,
    selectedCollection,
    setSelectedCollection,
    selectedTags,
    toggleTag,
    clearTags,
    collections,
    tags,
    searchQuery,
    setSearchQuery,
  } = useBookmarksStore();

  return (
    <Sidebar collapsible="offcanvas" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
              <div className="size-7 rounded-full overflow-hidden bg-linear-to-br from-blue-400 via-indigo-500 to-violet-500 flex items-center justify-center ring-1 ring-white/40 shadow-lg" />
              <span className="font-medium text-muted-foreground">SYWYKE</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
                Workspaces
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <div className="size-5 rounded-full bg-linear-to-br from-blue-400 via-indigo-500 to-violet-500 mr-2" />
                SYWYKE
                <Check className="size-4 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="size-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="size-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4 mr-2" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="size-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  !collectionsOpen && "-rotate-90"
                )}
              />
              COLLECTIONS
            </button>
          </SidebarGroupLabel>
          {collectionsOpen && (
            <SidebarGroupContent>
              <SidebarMenu className="mt-2">
                {collections.map((collection) => {
                  const IconComponent =
                    collectionIcons[collection.icon] || Folder;
                  const isActive =
                    currentView === "all" &&
                    selectedCollection === collection.id;
                  return (
                    <SidebarMenuItem key={collection.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className="h-[38px]"
                        onClick={() => {
                          setSelectedCollection(collection.id);
                          clearTags();
                        }}
                      >
                        <IconComponent className="size-5" />
                        <span className="flex-1">{collection.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {collection.count}
                        </span>
                        {isActive && (
                          <ChevronRight className="size-4 text-muted-foreground opacity-60" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="flex items-center gap-1.5 px-0 text-[10px] font-semibold tracking-wider text-muted-foreground">
            <button
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
        <SidebarGroup className="p-0 pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    className="h-[38px]"
                    onClick={() => setCurrentView(item.id)}
                  >
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
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
