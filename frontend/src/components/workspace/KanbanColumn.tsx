import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FiPlus } from "react-icons/fi";
import SortableTaskCard from "./SortableTaskCard";

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  subtasks: { id: string; completed: boolean }[];
  labels: { id: string; name: string; color: string }[];
  attachments?: { id: string; name: string; url: string }[];
  comments?: { id: string; content: string }[];
  _count?: { comments: number; attachments: number };
  assignee?: { id: string; name: string; image?: string } | null;
}

export default function KanbanColumn({
  column,
  onSelectTask,
  onDeleteTask,
  onAddTask,
}: {
  column: { id: string; name: string; tasks: Task[] };
  onSelectTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-[#111318] border border-white/[0.04]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-300">
            {column.name}
          </span>
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-zinc-600">
            {column.tasks?.length || 0}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="rounded p-1 text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-400"
        >
          <FiPlus size={14} />
        </button>
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-1 space-y-2 p-3 overflow-y-auto transition-colors ${isOver ? "bg-amber-500/5" : ""}`}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onDelete={onDeleteTask}
            />
          ))}
          <button
            onClick={onAddTask}
            className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-[12px] text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 transition-colors"
          >
            <FiPlus size={12} /> Add task
          </button>
        </div>
      </SortableContext>
    </div>
  );
}
