import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSearch, FiCheckSquare, FiFolder, FiUser, FiTag } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

interface SearchResults {
  tasks: { id: string; title: string; subtitle: string; projectId: string }[];
  projects: { id: string; name: string }[];
  members: { id: string; name: string; email: string; image?: string }[];
  labels: { id: string; name: string; color: string; projectId: string }[];
}

export default function SearchPalette() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // Fetch on query change
  useEffect(() => {
    if (!query.trim() || query.length < 1) { setResults(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
        if (r.ok) setResults(await r.json());
      } catch { /* ignore */ }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, workspaceId]);

  const allItems = results ? [
    ...results.tasks.map((t) => ({ ...t, kind: "task" as const, icon: <FiCheckSquare size={13} /> })),
    ...results.projects.map((p) => ({ ...p, kind: "project" as const, icon: <FiFolder size={13} /> })),
    ...results.members.map((m) => ({ ...m, kind: "member" as const, icon: <FiUser size={13} /> })),
    ...results.labels.map((l) => ({ ...l, kind: "label" as const, icon: <FiTag size={13} /> })),
  ] : [];

  const handleSelect = (item: typeof allItems[0]) => {
    setOpen(false); setQuery("");
    if (item.kind === "task") navigate(`/workspace/${workspaceId}/projects/${item.projectId}?taskId=${item.id}`);
    else if (item.kind === "project") navigate(`/workspace/${workspaceId}/projects/${item.id}`);
    else if (item.kind === "member") navigate(`/workspace/${workspaceId}/members`);
    else if (item.kind === "label") navigate(`/workspace/${workspaceId}/projects/${item.projectId}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111318] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
          <FiSearch size={16} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && allItems[selectedIdx]) handleSelect(allItems[selectedIdx]);
            }}
            placeholder="Search tasks, projects, members, labels..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-600">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && <p className="px-4 py-6 text-center text-sm text-zinc-600">Searching...</p>}
          {!loading && !results && query.length > 0 && <p className="px-4 py-6 text-center text-sm text-zinc-600">Type to search...</p>}
          {!loading && results && allItems.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-600">No results found.</p>}

          {allItems.map((item, i) => (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => handleSelect(item)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
            >
              <span className="text-zinc-500">{item.icon}</span>
              <span className="flex-1 text-[13px] text-white truncate">
                {"title" in item ? item.title : "name" in item ? (item as any).name : ""}
              </span>
              <span className="text-[11px] text-zinc-600 capitalize">{item.kind}</span>
              {"email" in item && <span className="text-[11px] text-zinc-600 truncate max-w-[120px]">{item.email}</span>}
              {"color" in item && <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: (item as any).color }} />}
              {"subtitle" in item && <span className="text-[11px] text-zinc-600 truncate max-w-[140px]">{item.subtitle}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
