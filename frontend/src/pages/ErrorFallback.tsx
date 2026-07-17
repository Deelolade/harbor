import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorFallback() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = status === 404 ? "Page not found" : "Error";
    message = error.statusText || error.data?.message || message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0E12] text-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-6xl font-bold text-zinc-700">{status}</h1>
        <h2 className="mt-4 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Go home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/[0.08] bg-transparent px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
