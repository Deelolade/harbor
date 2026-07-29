import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiX, FiCalendar, FiUser, FiFlag } from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Member {
  userId: string;
  user: { id: string; name: string; email: string; image?: string };
}

interface TaskCreateModalProps {
  columnId: string;
  columnName: string;
  members: Member[];
  onClose: () => void;
}

const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
const labelColors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

export default function TaskCreateModal({ columnId, columnName, members, onClose }: TaskCreateModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<typeof priorities[number]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [labels, setLabels] = useState<{ name: string; color: string }[]>([]);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(labelColors[0]);

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/columns/${columnId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          priority,
          dueDate: dueDate || undefined,
          assigneeId: assigneeId || undefined,
          labels: labels.length ? labels : undefined,
        }),
        credentials: "include",
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Task created.");
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create task."),
  });

  const addLabel = () => {
    if (!labelName.trim()) return;
    if (labels.find(l => l.name.toLowerCase() === labelName.trim().toLowerCase())) return;
    setLabels(prev => [...prev, { name: labelName.trim(), color: labelColor }]);
    setLabelName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-12">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#111318] shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div>
            <h3 className="text-lg font-semibold">New task</h3>
            <p className="text-xs text-zinc-500">in {columnName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-white"><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
            placeholder="Task title" className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-zinc-600 focus:outline-none" />

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What needs to be done?"
              className="w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"><FiFlag size={11} /> Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none">
                {priorities.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"><FiCalendar size={11} /> Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none [color-scheme:dark]" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"><FiUser size={11} /> Assignee</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-2 text-[13px] text-zinc-300 focus:border-amber-500/30 focus:outline-none">
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">Labels</label>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.map((l, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: l.color }}>
                    {l.name}
                    <button type="button" onClick={() => setLabels(prev => prev.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100"><FiX size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={labelName} onChange={e => setLabelName(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLabel())}
                placeholder="Label name" className="flex-1 rounded-lg border border-[#1F1F23] bg-[#0D0E12] px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none" />
              <div className="flex items-center gap-1">
                {labelColors.map(c => <button key={c} type="button" onClick={() => setLabelColor(c)} className={`h-5 w-5 rounded-full border-2 ${labelColor === c ? "border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />)}
              </div>
              <button type="button" onClick={addLabel} disabled={!labelName.trim()} className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 border border-[#1F1F23] hover:bg-white/[0.04] disabled:opacity-30">Add</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04]">Cancel</button>
            <button type="submit" disabled={createTask.isPending || !title.trim()} className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40">
              {createTask.isPending ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
