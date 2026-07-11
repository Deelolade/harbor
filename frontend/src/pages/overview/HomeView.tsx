import { authClient } from "../../lib/auth-client";
import {
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

export default function HomeView() {
  const { data: session } = authClient.useSession();
  const name = session?.user?.name?.split(" ")[0] || "User";

  return (
    <div className="p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Good morning, {name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard
          icon={<FiCheckCircle size={16} className="text-emerald-400" />}
          label="Completed this week"
          value="12"
          trend="+3"
        />
        <StatCard
          icon={<FiClock size={16} className="text-amber-400" />}
          label="Due this week"
          value="5"
          trend="-2"
        />
        <StatCard
          icon={<FiMessageSquare size={16} className="text-violet-400" />}
          label="Unread comments"
          value="8"
          trend="+5"
        />
        <StatCard
          icon={<FiTrendingUp size={16} className="text-sky-400" />}
          label="Active projects"
          value="3"
          trend="—"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* My tasks */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111318] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold">My tasks</h2>
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-white transition-colors">
              <FiPlus size={13} />
              Add task
            </button>
          </div>
          <div className="space-y-2">
            <TaskItem
              label="Review onboarding flow"
              project="Design System"
              due="Today"
            />
            <TaskItem
              label="Finalize v2.4 changelog"
              project="Marketing Site"
              due="Tomorrow"
            />
            <TaskItem
              label="Update API endpoints"
              project="Mobile App"
              due="Fri"
              done
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111318] p-6">
          <h2 className="text-sm font-semibold mb-5">Recent activity</h2>
          <div className="space-y-4">
            <ActivityItem
              avatar="L"
              name="Lisa Chen"
              action="completed"
              target="Client sync at 3pm"
              time="10m ago"
            />
            <ActivityItem
              avatar="M"
              name="Marcus Webb"
              action="commented on"
              target="Design review"
              time="1h ago"
            />
            <ActivityItem
              avatar="S"
              name="Sarah Kim"
              action="joined the workspace"
              time="3h ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-[#111318] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-[13px] text-zinc-600">{trend}</span>
      </div>
    </div>
  );
}

function TaskItem({
  label,
  project,
  due,
  done,
}: {
  label: string;
  project: string;
  due: string;
  done?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.02] ${
        done ? "opacity-50" : ""
      }`}
    >
      <div
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          done ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-700"
        }`}
      >
        {done && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34D399"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span
        className={`flex-1 text-sm ${done ? "text-zinc-500 line-through" : "text-zinc-200"}`}
      >
        {label}
      </span>
      <span className="text-xs text-zinc-600">{project}</span>
      <span className="text-xs text-zinc-600">{due}</span>
    </div>
  );
}

function ActivityItem({
  avatar,
  name,
  action,
  target,
  time,
}: {
  avatar: string;
  name: string;
  action: string;
  target?: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-zinc-400">
        {avatar}
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium text-white">{name}</span>{" "}
          <span className="text-zinc-500">{action}</span>
          {target && <span className="font-medium text-white"> {target}</span>}
        </p>
        <p className="text-xs text-zinc-600">{time}</p>
      </div>
    </div>
  );
}
