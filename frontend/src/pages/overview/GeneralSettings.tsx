import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiChevronLeft } from "react-icons/fi";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Workspace {
  id: string;
  name: string;
  image?: string | null;
  ownerId: string;
  createdAt: string;
}

export default function GeneralSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();

  const { data: workspace, isLoading } = useQuery<Workspace>({
    queryKey: ["workspace", workspaceId, "full"],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to load workspace");
        return r.json();
      }),
    enabled: !!workspaceId,
  });

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync fields when workspace loads (only once)
  if (workspace && !initialized) {
    setName(workspace.name);
    setImage(workspace.image || "");
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; image?: string }) => {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to update workspace.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["workspace", workspaceId], data);
      queryClient.setQueryData(["workspace", workspaceId, "full"], data);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update workspace.");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${API_URL}/api/v1/upload/image?workspaceId=${workspaceId}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Upload failed.");
      }

      const data = await res.json();
      setImage(data.url);

      // Refresh workspace caches (backend already stored the image)
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Workspace name cannot be empty.");
      return;
    }

    const payload: { name?: string; image?: string } = {};
    if (trimmed !== workspace?.name) payload.name = trimmed;
    if (image !== (workspace?.image || "")) payload.image = image || "";

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/workspace/${workspaceId}/settings`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
      >
        <FiChevronLeft size={15} />
        Settings
      </Link>

      <h1 className="text-xl font-semibold">General</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Manage your workspace name, image, and details.
      </p>

      <div className="mt-8 max-w-xl space-y-6">
        {/* Workspace image */}
        <div>
          <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
            Workspace image
          </label>
          <div className="flex items-start gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#1F1F23] bg-[#0D0E12] transition-colors hover:border-white/[0.12] disabled:opacity-60"
            >
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-700">
                  {workspace?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}

              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[11px] font-medium text-white">
                    {image ? "Change" : "Upload"}
                  </span>
                </div>
              )}
            </button>

            <div className="flex-1">
              <p className="text-[13px] text-zinc-500">
                Click the thumbnail to upload an image. PNG, JPG, WebP, or GIF
                up to 2MB.
              </p>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="mt-2 text-[13px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workspace name */}
        <div>
          <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
            Workspace name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
          />
        </div>

        {/* Workspace ID (read-only) */}
        <div>
          <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
            Workspace ID
          </label>
          <input
            value={workspace?.id || ""}
            readOnly
            className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-zinc-500 cursor-not-allowed"
          />
          <p className="mt-1 text-[12px] text-zinc-600">
            Used for API references. Cannot be changed.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="h-[48px] rounded-xl bg-amber-500 px-6 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
