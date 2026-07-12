import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; image?: string };
}

export default function MembersView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members`,
        {
          credentials: "include",
        },
      );
      if (res.ok) setMembers(await res.json());
    } catch {
      toast.error("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/invites`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail.trim() }),
          credentials: "include",
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      toast.success("Invitation sent!");
      setShowInvite(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const roleColors: Record<string, string> = {
    OWNER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ADMIN: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    MEMBER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <FiPlus size={15} />
          Invite member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No members yet — invite your team.
        </p>
      ) : (
        <div className="space-y-2 max-w-xl">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-[#111318] px-4 py-3"
            >
              <img
                src={m.user.image || ""}
                alt=""
                className="h-9 w-9 rounded-full bg-white/[0.06]"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {m.user.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{m.user.email}</p>
              </div>
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                  roleColors[m.role] || roleColors.MEMBER
                }`}
              >
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Invite member</h3>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteEmail("");
                }}
                className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4">
              They will receive an email with a link to join this workspace.
            </p>

            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              type="email"
              placeholder="colleague@company.com"
              autoFocus
              className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteEmail("");
                }}
                className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {inviting ? "Sending..." : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
