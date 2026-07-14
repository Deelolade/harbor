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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import TaskModal from "../../components/workspace/TaskModal";
import TaskCreateModal from "../../components/workspace/TaskCreateModal";
import KanbanColumn from "../../components/workspace/KanbanColumn";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}
interface Label {
  id: string;
  name: string;
  color: string;
}
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  order: number;
  assignee?: { id: string; name: string; email: string; image?: string } | null;
  subtasks: Subtask[];
  labels: Label[];
  _count?: { comments: number; attachments: number };
  // Lazy-loaded in task modal
  createdBy?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
  attachments?: { id: string; name: string; url: string }[];
  comments?: {
    id: string;
    content: string;
    author: { id: string; name: string; image?: string };
    createdAt: string;
  }[];
  column?: { id: string; name: string; boardId: string };
}
interface Column {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}
interface Board {
  id: string;
  name: string;
  order: number;
  archived: boolean;
  columns: Column[];
}
interface Member {
  userId: string;
  user: { id: string; name: string; email: string; image?: string };
}

async function fetchBoards(projectId: string): Promise<Board[]> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/boards`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error();
  return res.json();
}

async function fetchMembers(workspaceId: string): Promise<Member[]> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
    credentials: "include",
  });
  if (!res.ok) return [];
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
  const { data: members = [] } = useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    queryFn: () => fetchMembers(workspaceId!),
    enabled: !!workspaceId,
  });

  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewCol, setShowNewCol] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [creatingInColumn, setCreatingInColumn] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const suggestedColumns = ["Backlog", "Review"];
  const board = boards.find((b) => b.id === activeBoard) || boards[0];
  if (boards.length > 0 && !activeBoard) setActiveBoard(boards[0].id);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["boards", projectId] });

  const createBoard = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: (b: Board) => {
      invalidate();
      setShowNewBoard(false);
      setNewBoardName("");
      setActiveBoard(b.id);
    },
    onError: () => toast.error("Failed to create board."),
  });

  const createColumn = useMutation({
    mutationFn: async ({
      boardId,
      name,
    }: {
      boardId: string;
      name: string;
    }) => {
      const r = await fetch(`${API_URL}/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setShowNewCol(null);
      setNewColName("");
    },
    onError: () => toast.error("Failed to create column."),
  });

  const deleteBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const r = await fetch(`${API_URL}/api/boards/${boardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.message || "Permission denied.");
      }
    },
    onSuccess: (_d, boardId) => {
      invalidate();
      if (activeBoard === boardId) setActiveBoard(null);
      setDeleteTarget(null);
      toast.success("Board deleted.");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to delete board.");
      setDeleteTarget(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Task deleted.");
    },
    onError: () => toast.error("Failed to delete task."),
  });

  const moveTask = useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      order,
    }: {
      taskId: string;
      columnId: string;
      order: number;
    }) => {
      await fetch(`${API_URL}/api/tasks/${taskId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, order }),
        credentials: "include",
      });
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Failed to move task."),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overCol =
      board?.columns.find((c) => c.id === over.id) ||
      board?.columns.find((c) => c.tasks?.some((t) => t.id === over.id));
    if (!overCol) return;
    moveTask.mutate({
      taskId: String(active.id),
      columnId: overCol.id,
      order: overCol.tasks?.length || 0,
    });
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );

  return (
    <div className="flex h-full flex-col">
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
            <div
              key={b.id}
              className={`group flex items-center gap-0.5 rounded-lg ${b.id === (activeBoard || boards[0]?.id) ? "bg-white/[0.06]" : ""}`}
            >
              <button
                onClick={() => setActiveBoard(b.id)}
                className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${b.id === (activeBoard || boards[0]?.id) ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {b.name}
              </button>
              <button
                onClick={() => setDeleteTarget(b)}
                className="mr-1 rounded p-1 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowNewBoard(true)}
            className="ml-1 rounded-lg p-1.5 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400"
          >
            <FiPlus size={15} />
          </button>
        </div>
      </div>

      {board ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-4 overflow-x-auto p-6">
            {board.columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                onSelectTask={(t) => setSelectedTask(t as any)}
                onDeleteTask={(id) => deleteTask.mutate(id)}
                onAddTask={() =>
                  setCreatingInColumn({ id: col.id, name: col.name })
                }
              />
            ))}
            <div className="flex items-start gap-2">
              {showNewCol === board.id ? (
                <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-[#111318] border border-white/[0.04] p-3">
                  <input
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        createColumn.mutate({
                          boardId: board.id,
                          name: newColName,
                        });
                      if (e.key === "Escape") setShowNewCol(null);
                    }}
                    autoFocus
                    placeholder="Column name"
                    className="h-[40px] w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 text-[14px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        createColumn.mutate({
                          boardId: board.id,
                          name: newColName,
                        })
                      }
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
                <div className="flex items-center gap-2">
                  {suggestedColumns.map((col) => (
                    <button
                      key={col}
                      onClick={() =>
                        createColumn.mutate({ boardId: board.id, name: col })
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition-colors"
                    >
                      <FiPlus size={12} /> {col}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewCol(board.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] px-3 py-2 text-xs text-zinc-600 hover:border-white/[0.08] hover:text-zinc-400 transition-colors"
                  >
                    <FiPlus size={12} /> Add column
                  </button>
                </div>
              )}
            </div>
          </div>
        </DndContext>
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <FiTrash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete board</h3>
                <p className="text-sm text-zinc-500">
                  This will permanently delete "{deleteTarget.name}".
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBoard.mutate(deleteTarget.id)}
                disabled={deleteBoard.isPending}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
              >
                {deleteBoard.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal
          key={selectedTask.id}
          taskId={selectedTask.id}
          members={members}
          onClose={() => {
            setSelectedTask(null);
            invalidate();
          }}
        />
      )}
      {creatingInColumn && (
        <TaskCreateModal
          columnId={creatingInColumn.id}
          columnName={creatingInColumn.name}
          members={members}
          onClose={() => setCreatingInColumn(null)}
        />
      )}
    </div>
  );
}
