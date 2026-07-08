import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { useVerifyEmail } from "../../hooks/use-auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const verify = useVerifyEmail();

  useEffect(() => {
    if (token) verify.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout
      mode="signin"
      title="Verify email"
      subtitle={
        verify.isPending
          ? "Verifying your email address..."
          : verify.isSuccess
            ? "Your email has been verified!"
            : verify.isError
              ? "Verification failed."
              : "Click below to verify your email."
      }
      footer={
        <Link
          to="/sign-in"
          className="font-semibold text-white hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4 text-center">
        {!token && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[14px] text-red-400">
            Invalid verification link. Please check your email.
          </div>
        )}

        {verify.isPending && (
          <div className="flex justify-center py-3">
            <svg
              className="h-6 w-6 animate-spin text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}

        {verify.isSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[14px] text-emerald-400">
            Your email has been verified. You can now sign in.
          </div>
        )}

        {verify.isError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[14px] text-red-400">
            {verify.error?.message ||
              "Couldn't verify your email. The link may have expired."}
          </div>
        )}

        {!verify.isPending && !verify.isSuccess && token && (
          <Button
            onClick={() => verify.mutate({ token })}
            loading={verify.isPending}
            className="w-full"
          >
            Verify email
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
