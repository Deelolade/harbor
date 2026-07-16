import { FiSearch } from "react-icons/fi";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  mode: "commands" | "search";
  filtered: CommandItem[];
  activeIndex: number;
}

export default function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  mode,
  filtered,
  activeIndex,
}: Props) {
  if (!open) return null;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  let i = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#111318] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3">
          <FiSearch size={16} className="text-zinc-600" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={mode === "search" ? "Search..." : "Type a command..."}
            autoFocus
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-600">
            esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                {category}
              </p>
              {items.map((item) => {
                i++;
                const isActive = i === activeIndex && query;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white/[0.06] text-white"
                        : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-zinc-600">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-white/[0.04] px-4 py-2">
          <span className="text-[11px] text-zinc-600">
            <kbd className="rounded bg-white/[0.04] px-1 py-0.5">↵</kbd> select
          </span>
          <span className="text-[11px] text-zinc-600">
            <kbd className="rounded bg-white/[0.04] px-1 py-0.5">↑↓</kbd>{" "}
            navigate
          </span>
          <span className="text-[11px] text-zinc-600">
            <kbd className="rounded bg-white/[0.04] px-1 py-0.5">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
