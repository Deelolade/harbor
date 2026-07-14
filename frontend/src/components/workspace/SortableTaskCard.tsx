import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiTrash2, FiCalendar, FiMessageSquare, FiPaperclip } from "react-icons/fi";

interface Task {
  id: string; title: string; priority: string; dueDate?: string;
  subtasks: { id: string; completed: boolean }[];
  labels: { id: string; name: string; color: string }[];
  attachments: { id: string; name: string; url: string }[];
  comments: { id: string; content: string }[];
  assignee?: { id: string; name: string; image?: string } | null;
}

const priorityColors: Record<string, string> = { URGENT: "bg-red-500", HIGH: "bg-amber-500", MEDIUM: "bg-blue-500", LOW: "bg-zinc-500" };

export default function SortableTaskCard({
  task,
  onSelect,
  onDelete,
}: {
  task: Task;
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const done = task.subtasks.filter((s) => s.completed).length;
  const total = task.subtasks.length;
  const overdue = task.dueDate && new Date(task.dueDate) < new Date();
  const soon = task.dueDate && !overdue && (new Date(task.dueDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;
  const visLabels = task.labels?.slice(0, 3) || [];
  const overflow = (task.labels?.length || 0) - 3;
  const strip = priorityColors[task.priority] || priorityColors.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className="group relative cursor-grab active:cursor-grabbing rounded-lg border border-white/[0.04] bg-[#0D0E12] pl-[6px] hover:border-white/[0.08] hover:-translate-y-px hover:shadow-lg hover:shadow-black/20 transition-all duration-150 touch-none"
    >
      <div className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${strip}`} />
      <div className="p-2.5 pl-2">
        {visLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {visLabels.map((l) => <span key={l.id} className="rounded px-1.5 py-px text-[10px] font-medium text-white" style={{ backgroundColor: l.color }}>{l.name}</span>)}
            {overflow > 0 && <span className="rounded px-1.5 py-px text-[10px] font-medium text-zinc-500 bg-white/[0.04]">+{overflow}</span>}
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <span className="flex-1 text-[13px] text-zinc-300 leading-snug line-clamp-2">{task.title}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 rounded p-0.5 text-zinc-600 hover:text-red-400 transition-opacity"><FiTrash2 size={12} /></button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
          {total > 0 && <span className={done === total ? "text-emerald-500" : ""}>{done}/{total}</span>}
          {task.dueDate && (overdue || soon) && (
            <span className={`flex items-center gap-0.5 ${overdue ? "text-red-400" : "text-amber-400"}`}><FiCalendar size={10} />{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          )}
          {task.attachments?.length > 0 && <span className="flex items-center gap-0.5"><FiPaperclip size={10} />{task.attachments.length}</span>}
          {task.comments?.length > 0 && <span className="flex items-center gap-0.5"><FiMessageSquare size={10} />{task.comments.length}</span>}
          <span className="flex-1" />
          {task.assignee && <img src={task.assignee.image || ""} alt="" className="h-[18px] w-[18px] rounded-full bg-white/[0.06]" title={task.assignee.name} />}
        </div>
      </div>
    </div>
  );
}
