import { Link, useParams } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

export default function BillingSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <Link
        to={`/workspace/${workspaceId}/settings`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
      >
        <FiChevronLeft size={15} />
        Settings
      </Link>

      <h1 className="text-xl font-semibold">Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Manage your plan, invoices, and payment methods.
      </p>

      <div className="mt-8 max-w-xl rounded-2xl border border-white/[0.04] bg-[#111318] p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
          <svg
            className="h-5 w-5 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">
          Billing is coming soon
        </p>
        <p className="mt-1 text-[13px] text-zinc-600">
          Plan management, invoices, and payment methods will be available here.
        </p>
      </div>
    </div>
  );
}
