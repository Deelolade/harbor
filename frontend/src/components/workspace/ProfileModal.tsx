import { useState, useRef } from "react";
import { FiX, FiCamera, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

type Section = "main" | "change-email" | "confirm-email" | "change-password";

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [section, setSection] = useState<Section>("main");
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [newEmail, setNewEmail] = useState("");
  const [confirmToken, setConfirmToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB."); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/v1/upload/image`, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Upload failed.");
      setImage((await res.json()).url);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Save profile (name + avatar) ──
  const handleSaveProfile = async () => {
    setNameError("");
    if (!name.trim()) { setNameError("Name is required"); return; }
    if (name.length > 64) { setNameError("Name must be 64 characters or less"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/account/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image || null }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed.");
      toast.success("Profile updated!");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change email (initiate) ──
  const handleChangeEmail = async () => {
    setEmailError("");
    if (!newEmail.trim()) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("Invalid email format"); return; }
    if (newEmail.toLowerCase().trim() === user.email?.toLowerCase()) { setEmailError("Same as current email"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/account/change-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed.");
      toast.success("Confirmation email sent!");
      setNewEmail("");
      setSection("confirm-email");
    } catch (err: any) {
      setEmailError(err?.message || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm email change ──
  const handleConfirmEmail = async () => {
    if (!confirmToken.trim()) { toast.error("Enter the confirmation token."); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/account/confirm-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: confirmToken.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed.");
      toast.success("Email changed!");
      setConfirmToken("");
      setSection("main");
      onUpdate();
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired token.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword) { setPasswordError("Current password is required"); return; }
    if (!newPassword || newPassword.length < 8) { setPasswordError("New password must be at least 8 characters"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/account/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed.");
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setSection("main");
    } catch (err: any) {
      setPasswordError(err?.message || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Main section ──
  if (section === "main") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Edit profile</h3>
            <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors">
              <FiX size={18} />
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {image ? (
                <img src={image} alt="" className="h-20 w-20 rounded-full bg-white/[0.06] object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06] text-2xl font-bold text-zinc-600">{name?.charAt(0).toUpperCase() || "?"}</div>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60"><div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-colors">
                  <FiCamera size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">Name</label>
              <input value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }}
                className={`h-[44px] w-full rounded-xl border bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 ${nameError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/15" : "border-[#1F1F23] focus:border-amber-500/30 focus:ring-amber-500/15"}`} />
              {nameError && <p className="mt-1 text-[12px] text-red-400">{nameError}</p>}
            </div>

            {image && (
              <button type="button" onClick={() => setImage("")} className="text-[13px] text-zinc-400 hover:text-red-400 transition-colors">Remove photo</button>
            )}

            <button onClick={handleSaveProfile} disabled={saving || !name.trim()} className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors">
              {saving ? "Saving..." : "Save changes"}
            </button>

            <div className="h-px bg-white/[0.06]" />

            {/* Email section */}
            <button onClick={() => setSection("change-email")} className="flex w-full items-center justify-between rounded-xl border border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.02]">
              <div>
                <p className="text-[13px] font-medium text-white">Email</p>
                <p className="text-[12px] text-zinc-500">{user.email}</p>
              </div>
              <FiChevronRight size={14} className="text-zinc-600" />
            </button>

            {/* Password section */}
            <button onClick={() => setSection("change-password")} className="flex w-full items-center justify-between rounded-xl border border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.02]">
              <div>
                <p className="text-[13px] font-medium text-white">Password</p>
                <p className="text-[12px] text-zinc-500">Change your password</p>
              </div>
              <FiChevronRight size={14} className="text-zinc-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Change email section ──
  if (section === "change-email") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSection("main")} className="rounded-md p-1 text-zinc-500 hover:text-white transition-colors"><FiChevronLeft size={18} /></button>
            <h3 className="text-lg font-semibold">Change email</h3>
          </div>

          <p className="text-[13px] text-zinc-500 mb-4">Current: {user.email}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">New email</label>
              <input value={newEmail} type="email" onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                className={`h-[44px] w-full rounded-xl border bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 ${emailError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/15" : "border-[#1F1F23] focus:border-amber-500/30 focus:ring-amber-500/15"}`} />
              {emailError && <p className="mt-1 text-[12px] text-red-400">{emailError}</p>}
            </div>

            <button onClick={handleChangeEmail} disabled={saving || !newEmail.trim()} className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors">
              {saving ? "Sending..." : "Send confirmation email"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm email section ──
  if (section === "confirm-email") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSection("main")} className="rounded-md p-1 text-zinc-500 hover:text-white transition-colors"><FiChevronLeft size={18} /></button>
            <h3 className="text-lg font-semibold">Confirm email change</h3>
          </div>

          <p className="text-[13px] text-zinc-500 mb-4">Enter the confirmation code sent to your new email address.</p>

          <div className="space-y-4">
            <div>
              <input value={confirmToken} onChange={(e) => setConfirmToken(e.target.value)}
                placeholder="Paste confirmation code"
                className="h-[44px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15" />
            </div>

            <button onClick={handleConfirmEmail} disabled={saving || !confirmToken.trim()} className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors">
              {saving ? "Confirming..." : "Confirm email change"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Change password section ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSection("main")} className="rounded-md p-1 text-zinc-500 hover:text-white transition-colors"><FiChevronLeft size={18} /></button>
          <h3 className="text-lg font-semibold">Change password</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">Current password</label>
            <input value={currentPassword} type="password" onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }}
              className={`h-[44px] w-full rounded-xl border bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 ${passwordError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/15" : "border-[#1F1F23] focus:border-amber-500/30 focus:ring-amber-500/15"}`} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">New password</label>
            <input value={newPassword} type="password" onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
              placeholder="At least 8 characters"
              className={`h-[44px] w-full rounded-xl border bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 ${passwordError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/15" : "border-[#1F1F23] focus:border-amber-500/30 focus:ring-amber-500/15"}`} />
            {passwordError && <p className="mt-1 text-[12px] text-red-400">{passwordError}</p>}
          </div>

          <button onClick={handleChangePassword} disabled={saving} className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors">
            {saving ? "Changing..." : "Change password"}
          </button>
        </div>
      </div>
    </div>
  );
}
