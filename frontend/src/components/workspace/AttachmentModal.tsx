import { useState } from "react";
import { FiX, FiExternalLink, FiEdit2, FiCheck, FiFile, FiImage, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

interface Attachment {
  id: string;
  name: string;
  url: string;
}

interface AttachmentModalProps {
  attachment: Attachment;
  onClose: () => void;
  onUpdated: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "";

const isImageUrl = (url: string) =>
  /[.](png|jpg|jpeg|gif|webp|avif|svg)([?]|$)/i.test(url);

export default function AttachmentModal({
  attachment,
  onClose,
  onUpdated,
}: AttachmentModalProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attachment.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const image = isImageUrl(attachment.url);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/attachments/${attachment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
          credentials: "include",
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to rename");
      }
      toast.success("Attachment renamed.");
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to rename attachment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/attachments/${attachment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete");
      }
      toast.success("Attachment deleted.");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete attachment.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCancel = () => {
    setName(attachment.name);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111318] shadow-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-[13px] font-semibold text-white truncate pr-2">
            Attachment
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 pt-4 pb-2">
          {image ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0D0E12] overflow-hidden">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full max-h-48 object-contain bg-[#0A0B0E]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-500">
                <FiImage size={13} />
                Image
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0D0E12] py-8">
              <FiFile size={32} className="text-zinc-600" />
              <span className="text-[12px] text-zinc-500">
                {attachment.name.split(".").pop()?.toUpperCase() || "File"}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="px-5 py-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
            File name
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 rounded-lg border border-white/[0.08] bg-[#0D0E12] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="rounded-lg bg-amber-500 p-2 text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                ) : (
                  <FiCheck size={14} />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[13px] text-zinc-300 truncate">
                {attachment.name}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Rename"
              >
                <FiEdit2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-white/[0.04]">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-[12px] text-zinc-400 text-center">
                Permanently delete this attachment?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg px-4 py-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <FiExternalLink size={13} />
                Open in new tab
              </a>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <FiTrash2 size={13} />
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg px-4 py-2 text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
