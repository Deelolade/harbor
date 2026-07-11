export default function SettingsView() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Workspace settings</h1>
      <p className="mt-2 text-sm text-zinc-500">Manage your team, billing, and preferences.</p>

      <div className="mt-8 grid gap-4 max-w-xl">
        <SettingCard title="General" description="Workspace name, URL, and branding" />
        <SettingCard title="Members" description="Invite and manage team members" />
        <SettingCard title="Billing" description="Plan, invoices, and payment methods" />
        <SettingCard title="Integrations" description="Connect tools your team uses" />
        <SettingCard title="Danger zone" description="Delete workspace or transfer ownership" danger />
      </div>
    </div>
  );
}

function SettingCard({ title, description, danger }: { title: string; description: string; danger?: boolean }) {
  return (
    <button className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
      danger
        ? "border-red-500/10 bg-red-500/5 hover:bg-red-500/10"
        : "border-white/[0.04] bg-[#111318] hover:bg-white/[0.02]"
    }`}>
      <div>
        <p className={`text-sm font-medium ${danger ? "text-red-400" : "text-white"}`}>{title}</p>
        <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>
      </div>
      <svg className={`h-4 w-4 ${danger ? "text-red-400" : "text-zinc-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
