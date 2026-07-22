import { ArrowLeft, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  tags: string[];
}

interface AdminPanelProps {
  initialBookmarks: Bookmark[];
}

const VALID_TAGS = [
  "ai",
  "design",
  "develop",
  "download",
  "explore",
  "language",
  "learn",
  "opensource",
  "photo",
  "share",
  "tool",
  "ui",
  "video",
];

export function AdminPanel({ initialBookmarks }: AdminPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter bookmarks by search query
  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const normalizedId = id
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");

    if (!normalizedId || !title.trim() || !url.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: normalizedId,
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
          tags: selectedTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add site");
      }

      // Add to local state
      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
      const newBookmark: Bookmark = {
        id: normalizedId,
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        favicon,
        tags: selectedTags,
      };

      setBookmarks((prev) =>
        [newBookmark, ...prev].sort((a, b) => a.title.localeCompare(b.title))
      );

      // Reset Form
      setId("");
      setTitle("");
      setUrl("");
      setDescription("");
      setSelectedTags([]);
      setSuccess("Site added successfully!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm(`Are you sure you want to delete "${siteId}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bookmarks?id=${siteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete site");
      }

      setBookmarks((prev) => prev.filter((b) => b.id !== siteId));
      setSuccess("Site deleted successfully!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete site.";
      alert(errorMsg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </a>
        <h1 className="text-xl font-semibold">SYWYKE Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Plus className="size-5" /> Add New Site
            </h2>

            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="site-id"
                  className="text-xs font-medium text-muted-foreground"
                >
                  ID (URL Slug / slug-format)
                </label>
                <input
                  id="site-id"
                  type="text"
                  placeholder="e.g. animated-backgrounds"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="site-title"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Title
                </label>
                <input
                  id="site-title"
                  type="text"
                  placeholder="e.g. Animated Backgrounds"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="site-url"
                  className="text-xs font-medium text-muted-foreground"
                >
                  URL
                </label>
                <input
                  id="site-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="site-desc"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </label>
                <textarea
                  id="site-desc"
                  placeholder="A short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  required
                />
              </div>

              {/* Tags Selector */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 border rounded-md bg-muted/20">
                  {VALID_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-xs text-emerald-600 bg-emerald-500/10 p-2.5 rounded-md">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 rounded-md bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Add Site
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search registered sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredBookmarks.length} site
              {filteredBookmarks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="border rounded-xl divide-y bg-card text-card-foreground shadow-xs max-h-[600px] overflow-y-auto">
            {filteredBookmarks.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No sites matched your query.
              </div>
            ) : (
              filteredBookmarks.map((site) => (
                <div
                  key={site.id}
                  className="p-4 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <img
                        src={site.favicon}
                        alt=""
                        className="size-4 rounded-xs object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://www.google.com/s2/favicons?domain=localhost&sz=64";
                        }}
                      />
                      <h3 className="font-medium text-sm truncate">
                        {site.title}
                      </h3>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                        {site.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {site.description}
                    </p>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline truncate block"
                    >
                      {site.url}
                    </a>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {site.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSite(site.id)}
                    className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Delete site"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
