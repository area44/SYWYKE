"use client";

import {
  ArrowUpDown,
  Check,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBookmarksStore } from "@/store/bookmarks-store";

interface BookmarksHeaderProps {
  title?: string;
}

const sortOptions = [
  { value: "date-newest", label: "Date Added (Newest)" },
  { value: "date-oldest", label: "Date Added (Oldest)" },
  { value: "alpha-az", label: "Alphabetical (A-Z)" },
  { value: "alpha-za", label: "Alphabetical (Z-A)" },
] as const;

const filterOptions = [
  { value: "all", label: "All Bookmarks" },
  { value: "favorites", label: "Favorites Only" },
  { value: "with-tags", label: "With Tags" },
  { value: "without-tags", label: "Without Tags" },
] as const;

export function BookmarksHeader({ title = "Bookmarks" }: BookmarksHeaderProps) {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterType,
    setFilterType,
  } = useBookmarksStore();

  const currentSort = sortOptions.find((opt) => opt.value === sortBy);
  const currentFilter = filterOptions.find((opt) => opt.value === filterType);

  return (
    <header className="w-full border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-base font-semibold hidden sm:block">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 h-9"
            />
          </div>

          <div className="flex items-center border rounded-md p-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn("rounded-sm", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn("rounded-sm", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ArrowUpDown className="size-4" />
                <span className="hidden lg:inline">
                  {currentSort?.label.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Sort by
              </DropdownMenuLabel>
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {sortBy === option.value && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "hidden sm:flex",
                  filterType !== "all" && "border-primary text-primary"
                )}
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden lg:inline">
                  {filterType !== "all" ? currentFilter?.label : "Filter"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Filter by
              </DropdownMenuLabel>
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setFilterType(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {filterType === option.value && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
              {filterType !== "all" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setFilterType("all")}
                    className="text-muted-foreground"
                  >
                    Clear filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="hidden sm:flex" type="button">
            <Plus className="size-4" />
            Add Site
          </Button>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <ThemeToggle />

          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/AREA44/SYWYKE"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
