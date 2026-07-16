import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  FiX,
  FiTrash2,
  FiCalendar,
  FiUser,
  FiFlag,
  FiCheck,
  FiCircle,
  FiPlus,
  FiPaperclip,
  FiMessageSquare,
} from "react-icons/fi";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";

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
interface Attachment {
  id: string;
  name: string;
  url: string;
}
interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string; image?: string };
  createdAt: string;
}
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  assignee?: { id: string; name: string; email: string; image?: string } | null;
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
  subtasks: Subtask[];
  labels: Label[];
  attachments: Attachment[];
  comments: Comment[];
  column: { id: string; name: string; boardId: string };
}
interface Member {
  userId: string;
  user: { id: string; name: string; email: string; image?: string };
}

const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
const statuses = ["backlog", "todo", "in_progress", "review", "done"] as const;
const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};
const labelColors = [
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

export default function TaskModal({
  taskId,
  members,
  onClose,
}: {
  taskId: string;
  members: Member[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: initialTask, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      return res.json() as Promise<Task>;
    },
    enabled: !!taskId,
    staleTime: 0,
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("backlog");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: session } = authClient.useSession();
  const [comment, setComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(labelColors[0]);
  const [showAddLabel, setShowAddLabel] = useState(false);

  useEffect(() => {
    if (!initialTask) return;
    setTitle(initialTask.title);
    setDescription(initialTask.description || "");
    setPriority(initialTask.priority);
    setStatus(initialTask.status);
    setDueDate(initialTask.dueDate?.split("T")[0] || "");
    setAssigneeId(initialTask.assignee?.id || "");
  }, [initialTask]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["boards"] });

  const saveTask = async () => {
    if (!initialTask) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${initialTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          priority,
          status,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setStatus(updated.status);
      invalidate();
      toast.success("Task updated.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const addSubtask = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/tasks/${initialTask.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask.trim() }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      setNewSubtask("");
      invalidate();
    },
    onError: () => toast.error("Failed."),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/tasks/${initialTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      setComment("");
      invalidate();
    },
    onError: () => toast.error("Failed to add comment."),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API_URL}/api/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Failed to delete comment."),
  });

  const editComment = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      const r = await fetch(`${API_URL}/api/comments/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      invalidate();
      setEditingComment(null);
      setEditContent("");
    },
    onError: () => toast.error("Failed to edit comment."),
  });

  const addLabel = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/tasks/${initialTask.id}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: labelName.trim(), color: labelColor }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      setLabelName("");
      setShowAddLabel(false);
      invalidate();
    },
    onError: () => toast.error("Failed."),
  });

  const toggleSubtask = async (st: Subtask) => {
    await fetch(`${API_URL}/api/subtasks/${st.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !st.completed }),
      credentials: "include",
    });
    invalidate();
  };

  const deleteSubtask = async (id: string) => {
    await fetch(`${API_URL}/api/subtasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    invalidate();
  };
  const deleteLabel = async (id: string) => {
    await fetch(`${API_URL}/api/labels/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    invalidate();
  };

  const completed = initialTask?.subtasks.filter((s) => s.completed).length;
  const total = initialTask?.subtasks?.length || 0;

  if (isLoading || !initialTask) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.06] bg-[#111318] shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-2 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-2 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-600">
              {initialTask.column?.name || ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveTask}
              disabled={saving || !title.trim()}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6">
          <div className="col-span-2 space-y-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none"
              placeholder="Task title"
            />

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                className="w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none resize-none"
              />
            </div>

            {total > 0 && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                  Subtasks ({completed}/{total})
                </label>
                <div className="space-y-1">
                  {initialTask.subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleSubtask(st)}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        {st.completed ? (
                          <FiCheck size={14} className="text-emerald-400" />
                        ) : (
                          <FiCircle size={14} />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-[13px] ${st.completed ? "text-zinc-600 line-through" : "text-zinc-300"}`}
                      >
                        {st.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubtask.mutate()}
                placeholder="Add subtask..."
                className="flex-1 rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
              />
              <button
                onClick={() => addSubtask.mutate()}
                disabled={!newSubtask.trim()}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
              >
                <FiPlus size={14} />
              </button>
            </div>

            {/* Comments */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                <FiMessageSquare size={11} /> Comments
              </label>
              {initialTask.comments?.length > 0 && (
                <div className="space-y-3 mb-3">
                  {initialTask.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <img
                        src={c.author.image || ""}
                        alt=""
                        className="mt-0.5 h-6 w-6 rounded-full bg-white/[0.06]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-zinc-300">
                            {c.author.name}
                          </span>
                          <span className="text-[11px] text-zinc-600">
                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-[13px] text-zinc-400 leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment.mutate()}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
                />
                <button
                  onClick={() => addComment.mutate()}
                  disabled={!comment.trim()}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>

            {initialTask.attachments?.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                  <FiPaperclip size={11} /> Attachments
                </label>
                <div className="space-y-1">
                  {initialTask.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    >
                      <FiPaperclip size={13} /> {a.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                <FiUser size={11} /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                <FiCalendar size={11} /> Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                <FiFlag size={11} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {initialTask.labels?.map((l) => (
                  <span
                    key={l.id}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                    <button
                      onClick={() => deleteLabel(l.id)}
                      className="opacity-60 hover:opacity-100"
                    >
                      <FiX size={10} />
                    </button>
                  </span>
                ))}
              </div>
              {showAddLabel ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={labelName}
                    onChange={(e) => setLabelName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLabel.mutate()}
                    placeholder="Label name"
                    autoFocus
                    className="rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {labelColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setLabelColor(c)}
                        className={`h-5 w-5 rounded-full border-2 ${labelColor === c ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addLabel.mutate()}
                      disabled={!labelName.trim()}
                      className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddLabel(false)}
                      className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLabel(true)}
                  className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400"
                >
                  <FiPlus size={11} /> Add label
                </button>
              )}
            </div>
            <div className="pt-3 border-t border-white/[0.04] space-y-1.5">
              {initialTask.createdBy && (
                <p className="text-[11px] text-zinc-600">
                  Created by {initialTask.createdBy.name}
                </p>
              )}
              {initialTask.updatedBy && (
                <p className="text-[11px] text-zinc-600">
                  Updated by {initialTask.updatedBy.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
