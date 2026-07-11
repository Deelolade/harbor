import { authClient } from "../lib/auth-client";

export default function Workspace() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-white/[0.06] bg-[#0A0A0A] p-5">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">Atlas</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {["Overview", "Projects", "Tasks", "Team", "Settings"].map((item) => (
            <button
              key={item}
              className="rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User pill */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
          <img
            src={user?.image || ""}
            alt=""
            className="h-8 w-8 rounded-full bg-white/[0.06]"
          />
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Welcome, {user?.name || "User"}</h2>
          <p className="mt-2 text-zinc-500">Your workspace is ready.</p>
        </div>
      </main>
    </div>
  );
}
