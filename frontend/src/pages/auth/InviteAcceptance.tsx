import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { FiMail, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import Input from "../../components/ui/Input";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface InviteDetails {
  workspaceName: string;
  inviterName: string;
  email: string;
  expiresAt: string;
}

export default function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Fetch invite details
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Missing invite token.");
      return;
    }
    fetch(`${API_URL}/api/workspaces/invites/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 410)
            setError("This invite has expired. Ask an admin to resend it.");
          else if (res.status === 404)
            setError("Invalid or already used invite link.");
          else setError("Could not load invite details.");
          return;
        }
        setDetails(await res.json());
      })
      .catch(() => setError("Could not load invite details."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!details) return;
    setAccepting(true);
    try {
      if (name.trim() && name !== session?.user?.name) {
        await authClient.updateUser({ name: name.trim() });
      }
      const res = await fetch(`${API_URL}/api/workspaces/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      const { workspaceId } = await res.json();
      toast.success("You've joined the workspace!");
      navigate(`/workspace/${workspaceId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <AuthLayout
        mode="signup"
        title="Loading invite..."
        subtitle=""
        footer={null}
      >
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      </AuthLayout>
    );
  }

  // ── Error state (expired, invalid, etc.) ──
  if (error || !details) {
    return (
      <AuthLayout
        mode="signup"
        title="Invitation"
        subtitle=""
        footer={
          <Link
            to="/sign-in"
            className="font-semibold text-white hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-6 text-center">
          <FiAlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </AuthLayout>
    );
  }

  const isSignedIn = !!session;
  const wrongEmail =
    isSignedIn &&
    session.user.email.toLowerCase() !== details.email.toLowerCase();
  const needsName = isSignedIn && !session.user.name;

  // ── Not signed in ──
  if (!isSignedIn) {
    const encoded = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    return (
      <AuthLayout
        mode="signup"
        title={`You're invited to ${details.workspaceName}`}
        subtitle={`${details.inviterName} invited you to join.`}
        footer={null}
      >
        <div className="space-y-4">
          {/* Locked email */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <FiMail size={16} className="text-zinc-500" />
            <span className="text-sm text-white">{details.email}</span>
          </div>

          <Link to={`/sign-up?redirect=${encoded}`} className="block">
            <Button className="w-full">Create an account</Button>
          </Link>
          <Link to={`/sign-in?redirect=${encoded}`} className="block">
            <Button variant="secondary" className="w-full">
              Sign in instead
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Signed in as wrong email ──
  if (wrongEmail) {
    return (
      <AuthLayout
        mode="signup"
        title={`You're invited to ${details.workspaceName}`}
        subtitle={`${details.inviterName} invited you to join.`}
        footer={null}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <p className="text-sm text-amber-300">
              This invite was sent to{" "}
              <span className="font-semibold text-white">{details.email}</span>,
              but you&apos;re signed in as{" "}
              <span className="font-semibold text-white">
                {session.user.email}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <FiMail size={16} className="text-zinc-500" />
            <span className="text-sm text-white">{details.email}</span>
          </div>

          <Button
            onClick={async () => {
              await authClient.signOut();
              window.location.reload();
            }}
            variant="secondary"
            className="w-full"
          >
            Switch accounts
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // ── Signed in with correct email — ready to accept ──
  return (
    <AuthLayout
      mode="signup"
      title={`You're invited to ${details.workspaceName}`}
      subtitle={`${details.inviterName} invited you to join.`}
      footer={
        <Link
          to="/sign-in"
          className="font-semibold text-white hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Signed in as */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <FiCheckCircle size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-300">
            Signed in as{" "}
            <span className="font-semibold text-white">{details.email}</span>
          </span>
        </div>

        {needsName && (
          <Input
            label="Your name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}

        <Button onClick={handleAccept} loading={accepting} className="w-full">
          Accept &amp; join workspace
        </Button>
      </div>
    </AuthLayout>
  );
}
