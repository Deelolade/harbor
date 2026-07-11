import { useState } from "react";
import { FiX, FiCamera } from "react-icons/fi";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";

interface ProfileModalProps {
  user: any;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authClient.updateUser({ name, image });
      toast.success("Profile updated!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit profile</h3>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <img src={image || ""} alt="" className="h-20 w-20 rounded-full bg-white/[0.06] object-cover" />
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-colors">
              <FiCamera size={13} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">Avatar URL</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
