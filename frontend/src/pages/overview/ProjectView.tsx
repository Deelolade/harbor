import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiX,
  FiFolder,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Column {
  id: string;
  name: string;
  order: number;
}
interface Board {
  id: string;
  name: string;
  order: number;
  archived: boolean;
  columns: Column[];
}

async function fetchBoards(projectId: string): Promise<Board[]> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/boards`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function ProjectView() {
  const { workspaceId, id: projectId } = useParams<{
    workspaceId: string;
    id: string;
  }>();
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => fetchBoards(projectId!),
    enabled: !!projectId,
  });

  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewCol, setShowNewCol] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");

  const board = boards.find((b) => b.id === activeBoard) || boards[0];
  if (boards.length > 0 && !activeBoard) setActiveBoard(boards[0].id);

  const createBoard = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: (b: Board) => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] });
      setShowNewBoard(false);
      setNewBoardName("");
      setActiveBoard(b.id);
    },
    onError: () => toast.error("Failed to create board."),
  });

  const createColumn = useMutation({
    mutationFn: async (boardId: string) => {
      const res = await fetch(`${API_URL}/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColName.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] });
      setShowNewCol(null);
      setNewColName("");
    },
    onError: () => toast.error("Failed to create column."),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb + board tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-8 py-2">
        <Link
          to={`/workspace/${workspaceId}`}
          className="text-[13px] font-semibold text-zinc-500 hover:text-zinc-300"
        >
          Projects
        </Link>
        <FiChevronRight size={13} className="text-zinc-700" />
        <span className="text-[13px] font-semibold text-white">Project</span>

        <div className="ml-8 flex items-center gap-1">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBoard(b.id)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                b.id === (activeBoard || boards[0]?.id)
                  ? "bg-white/[0.06] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewBoard(true)}
            className="ml-1 rounded-lg p-1.5 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400"
          >
            <FiPlus size={15} />
          </button>
        </div>
      </div>

      {/* Columns */}
      {board ? (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {board.columns?.map((col) => (
            <div
              key={col.id}
              className="flex w-64 shrink-0 flex-col rounded-xl bg-[#111318] border border-white/[0.04]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <span className="text-[13px] font-semibold text-zinc-300">
                  {col.name}
                </span>
              </div>
              <div className="flex-1 p-3">
                <p className="text-xs text-zinc-600 text-center py-8">
                  No tasks yet
                </p>
              </div>
            </div>
          ))}
          {/* Add column */}
          {showNewCol === board.id ? (
            <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-[#111318] border border-white/[0.04] p-3">
              <input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createColumn.mutate(board.id);
                  if (e.key === "Escape") setShowNewCol(null);
                }}
                autoFocus
                placeholder="Column name"
                className="h-[40px] w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 text-[14px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => createColumn.mutate(board.id)}
                  disabled={!newColName.trim()}
                  className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewCol(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCol(board.id)}
              className="flex w-64 shrink-0 items-center gap-2 rounded-xl border border-white/[0.04] px-4 py-3 text-[13px] text-zinc-600 hover:border-white/[0.08] hover:text-zinc-400"
            >
              <FiPlus size={14} /> Add column
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FiFolder size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No boards yet</p>
            <button
              onClick={() => setShowNewBoard(true)}
              className="mt-3 text-sm font-medium text-amber-500 hover:text-amber-400"
            >
              Create your first board
            </button>
          </div>
        </div>
      )}

      {/* New board modal */}
      {showNewBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">New board</h3>
            <input
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createBoard.mutate()}
              placeholder="e.g. Development"
              autoFocus
              className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewBoard(false);
                  setNewBoardName("");
                }}
                className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => createBoard.mutate()}
                disabled={createBoard.isPending || !newBoardName.trim()}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
              >
                {createBoard.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
