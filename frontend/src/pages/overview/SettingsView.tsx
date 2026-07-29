import { useState } from "react";
import { Link, Outlet, useParams, useNavigate } from "react-router-dom";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

export default function SettingsView() {
  return (
    <div className="p-8">
      <Outlet />
    </div>
  );
}

// ── Settings index (card list) ──
export function SettingsIndex() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete workspace.");
      }
      toast.success("Workspace deleted.");
      navigate("/workspaces");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to delete workspace.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold">Workspace settings</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Manage your team, billing, and preferences.
      </p>

      <div className="mt-8 grid gap-4 max-w-xl">
        <SettingLink
          to={`/workspace/${workspaceId}/settings/general`}
          title="General"
          description="Workspace name, URL, and branding"
        />
        <SettingLink
          to={`/workspace/${workspaceId}/settings/billing`}
          title="Billing"
          description="Plan, invoices, and payment methods"
        />
        <SettingCard
          title="Integrations"
          description="Connect tools your team uses"
          onClick={() => toast.info("Coming soon.")}
        />
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-between rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-left transition-colors hover:bg-red-500/10 w-full"
        >
          <div>
            <p className="text-sm font-medium text-red-400">Danger zone</p>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              Delete workspace or transfer ownership
            </p>
          </div>
          <Chevron />
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Delete workspace</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-red-500/10 bg-red-500/5 p-4 mb-5">
              <FiAlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />
              <div>
                <p className="text-sm font-medium text-red-400">
                  This action cannot be undone.
                </p>
                <p className="mt-1 text-[13px] text-zinc-400">
                  All projects, tasks, and member data will be permanently
                  deleted.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ──
function SettingLink({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#111318] p-4 text-left transition-colors hover:bg-white/[0.02]"
    >
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>
      </div>
      <Chevron />
    </Link>
  );
}

function SettingCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#111318] p-4 text-left transition-colors hover:bg-white/[0.02] w-full"
    >
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>
      </div>
      <Chevron />
    </button>
  );
}

function Chevron() {
  return (
    <svg
      className="h-4 w-4 text-zinc-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
