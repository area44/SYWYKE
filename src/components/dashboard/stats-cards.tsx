"use client";

import { Bookmark, Tag } from "lucide-react";
import { useBookmarksStore } from "@/store/bookmarks-store";

const stats = [
  {
    label: "Total Bookmarks",
    icon: Bookmark,
    color: "bg-muted text-muted-foreground",
  },
  {
    label: "Tags Used",
    icon: Tag,
    color: "bg-muted text-muted-foreground",
  },
];

export function StatsCards() {
  const { bookmarks, tags } = useBookmarksStore();
  const values = [bookmarks.length, tags.length];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 p-4 rounded-xl border bg-card"
        >
          <div
            className={`size-10 rounded-lg ${stat.color} flex items-center justify-center`}
          >
            <stat.icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{values[index]}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
