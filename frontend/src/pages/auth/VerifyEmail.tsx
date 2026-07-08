import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { useVerifyEmail } from "../../hooks/use-auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inner = (
    <div className="space-y-5 text-center">
      {!token && (
        <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
          The verification link is missing a token. Please check your email and
          try again.
        </div>
      )}

      {verifyEmail.isPending && (
        <div className="flex justify-center py-2">
          <svg
            className="h-6 w-6 animate-spin text-white/60"
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

      {verifyEmail.isSuccess && (
        <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/20 p-3 text-sm text-emerald-300">
          Your email has been verified. You can now sign in.
        </div>
      )}

      {verifyEmail.isError && (
        <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
          {verifyEmail.error?.message ||
            "We couldn't verify your email. The link may have expired."}
        </div>
      )}

      {!verifyEmail.isPending && !verifyEmail.isSuccess && token && (
        <Button
          onClick={() => verifyEmail.mutate({ token })}
          loading={verifyEmail.isPending}
          className="w-full"
        >
          Verify email
        </Button>
      )}

      <p className="text-center text-sm">
        <Link
          to="/sign-in"
          className="font-semibold text-blue-200 hover:text-white transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );

  return (
    <AuthLayout
      title="Verify email"
      description={
        verifyEmail.isPending
          ? "Verifying your email address..."
          : verifyEmail.isSuccess
            ? "Your email has been verified!"
            : verifyEmail.isError
              ? "Verification failed."
              : "Click the button below to verify your email."
      }
    >
      {inner}
    </AuthLayout>
  );
}
