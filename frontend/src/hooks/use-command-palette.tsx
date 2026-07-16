import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiHome,
  FiFolder,
  FiUsers,
  FiSettings,
} from "react-icons/fi";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: ReactNode;
  action: () => void;
  category: string;
}

export function useCommandPalette() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"commands" | "search">("commands");
  const [activeIndex, setActiveIndex] = useState(0);
  const gKeyTimer = useRef<ReturnType<typeof setTimeout>>();
  const gKeyHeld = useRef(false);

  const basePath = workspaceId ? `/workspace/${workspaceId}` : "";

  const commands: CommandItem[] = [
    {
      id: "home",
      label: "Go to Home",
      shortcut: "G H",
      icon: <FiHome size={16} />,
      category: "Navigation",
      action: () => navigate(basePath),
    },
    {
      id: "projects",
      label: "Go to Projects",
      shortcut: "G P",
      icon: <FiFolder size={16} />,
      category: "Navigation",
      action: () => navigate(`${basePath}?tab=projects`),
    },
    {
      id: "members",
      label: "Go to Members",
      shortcut: "G M",
      icon: <FiUsers size={16} />,
      category: "Navigation",
      action: () => navigate(`${basePath}/members`),
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: <FiSettings size={16} />,
      category: "Navigation",
      action: () => navigate(`${basePath}/settings`),
    },
    {
      id: "create-task",
      label: "Create task",
      shortcut: "C",
      icon: <FiPlus size={16} />,
      category: "Tasks",
      action: () => navigate(`${basePath}`),
    },
    {
      id: "search",
      label: "Search...",
      shortcut: "/",
      icon: <FiSearch size={16} />,
      category: "Search",
      action: () => {
        setMode("search");
        setQuery("");
        setActiveIndex(0);
      },
    },
  ];

  const filtered = commands.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  });

  const close = useCallback(() => {
    setOpen(false);
    setMode("commands");
    setQuery("");
    setActiveIndex(0);
  }, []);

  // Arrow key nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, filtered.length]);

  // Global shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      // Cmd/Ctrl + K → toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          close();
        } else {
          setMode("commands");
          setQuery("");
          setActiveIndex(0);
          setOpen(true);
        }
        return;
      }

      // When palette is open, handle Enter and Escape
      if (open) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (filtered[activeIndex]) {
            filtered[activeIndex].action();
            close();
          }
          return;
        }
        return; // Let the palette input handle typing
      }

      if (isInput) return;

      // G + key navigation (using ref for reliable timing)
      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        gKeyHeld.current = true;
        clearTimeout(gKeyTimer.current);
        gKeyTimer.current = setTimeout(() => {
          gKeyHeld.current = false;
        }, 600);
        return;
      }

      if (gKeyHeld.current) {
        e.preventDefault();
        gKeyHeld.current = false;
        clearTimeout(gKeyTimer.current);
        if (e.key.toLowerCase() === "h") {
          navigate(basePath);
          return;
        }
        if (e.key.toLowerCase() === "p") {
          navigate(`${basePath}?tab=projects`);
          return;
        }
        if (e.key.toLowerCase() === "m") {
          navigate(`${basePath}/members`);
          return;
        }
        return;
      }

      // / for quick search
      if (e.key === "/") {
        e.preventDefault();
        setMode("search");
        setQuery("");
        setActiveIndex(0);
        setOpen(true);
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, filtered, activeIndex, close, navigate, basePath]);

  return {
    open,
    setOpen,
    query,
    setQuery,
    mode,
    filtered,
    commands,
    activeIndex,
    close,
  };
}
