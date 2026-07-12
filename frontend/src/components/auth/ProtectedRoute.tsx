import { Navigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();

  console.log("[ProtectedRoute]", { isPending, hasSession: !!session });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0E12]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
