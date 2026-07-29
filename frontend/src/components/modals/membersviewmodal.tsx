import { useState, useRef, useEffect } from "react";
import { FiX, FiUserMinus, FiShield, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; image?: string };
}

interface MembersViewModalProps {
  showModal: boolean;
  onClose: () => void;
  member: Member;
  currentMember: Member | undefined;
  workspaceId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "";
const ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

export default function MembersViewModal({
  showModal,
  onClose,
  member,
  currentMember,
  workspaceId,
}: MembersViewModalProps) {
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showModal) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal, onClose]);

  if (!showModal) return null;

  const currentRole = currentMember?.role;
  const targetRole = member.role;
  const isSelf = currentMember?.userId === member.userId;
  const isOwner = currentRole === "OWNER";
  const isAdmin = currentRole === "ADMIN";

  // Permissions for Change role:
  // - OWNER can change non-OWNER members to any role
  // - ADMIN can change MEMBERs to MEMBER (effectively no-op) or to ADMIN? No — per backend only owner manages admins
  // - No one can change an OWNER's role (ownership transfer is a separate flow)
  const canChangeRole =
    (isOwner && targetRole !== "OWNER" && !isSelf) ||
    (isAdmin && targetRole === "MEMBER" && !isSelf);

  // Permissions for Remove member:
  // - OWNER can remove anyone except self (and can't remove another OWNER — but there's only one)
  // - ADMIN can remove MEMBERs only
  // - Anyone can remove themselves (self-removal), unless they're the OWNER
  const canRemove =
    (isOwner && !isSelf && targetRole !== "OWNER") ||
    (isAdmin && targetRole === "MEMBER") ||
    (isSelf && targetRole !== "OWNER");

  // If user has no permissions at all for this member, don't show any actions
  const hasAnyAction = canChangeRole || canRemove;

  const handleRemove = async () => {
    setLoading("remove");
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members/${member.userId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to remove member.");
      }
      toast.success(
        isSelf
          ? "You left the workspace."
          : `${member.user.name} removed from workspace.`,
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove member.");
    } finally {
      setLoading(null);
    }
  };

  const handleRoleChange = async (role: string) => {
    setLoading("role");
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members/${member.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
          credentials: "include",
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to change role.");
      }
      toast.success(`Role updated to ${role}.`);
      setShowRolePicker(false);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to change role.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-white/[0.08] bg-[#18181B] p-1.5 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <p className="truncate text-[13px] font-medium text-white">
          {isSelf ? "You" : member.user.name}
        </p>
        <button
          onClick={onClose}
          className="rounded-md p-0.5 text-zinc-500 hover:text-white transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>

      <div className="my-1 h-px bg-white/[0.06]" />

      {!showRolePicker ? (
        <>
          {canChangeRole && (
            <button
              onClick={() => setShowRolePicker(true)}
              disabled={loading !== null}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
            >
              <span className="flex items-center gap-2.5">
                <FiShield size={15} className="text-zinc-500" />
                Change role
              </span>
              <FiChevronRight size={14} className="text-zinc-600" />
            </button>
          )}

          {canRemove && (
            <button
              onClick={handleRemove}
              disabled={loading !== null}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
            >
              {loading === "remove" ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              ) : (
                <FiUserMinus size={15} />
              )}
              {isSelf ? "Leave workspace" : "Remove member"}
            </button>
          )}

          {!hasAnyAction && (
            <p className="px-3 py-2 text-[13px] text-zinc-600">
              No actions available
            </p>
          )}
        </>
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => setShowRolePicker(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition-colors hover:bg-white/[0.06]"
          >
            <FiChevronRight size={14} className="rotate-180" />
            Change role
          </button>

          <div className="my-1 h-px bg-white/[0.06]" />

          {/* Role options — filter based on who can assign what */}
          {ROLES.filter((role) => {
            // OWNER can assign any role
            if (isOwner) return true;
            // ADMIN can only assign MEMBER (they can't create owners or other admins)
            if (isAdmin) return role === "MEMBER";
            return false;
          }).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              disabled={loading !== null}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors disabled:opacity-40 ${
                member.role === role
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              {role.charAt(0) + role.slice(1).toLowerCase()}
              {member.role === role && (
                <span className="text-[11px] font-medium text-amber-400">
                  Current
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
