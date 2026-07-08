import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
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

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invalid Verification Link</CardTitle>
            <CardDescription>
              The verification link you followed is missing a token. Please
              check your email and try again, or request a new verification
              link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/sign-in">
              <Button variant="secondary">Back to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {verifyEmail.isPending
              ? "Verifying your email address..."
              : verifyEmail.isSuccess
                ? "Your email has been verified!"
                : verifyEmail.isError
                  ? "Verification failed."
                  : "Click the button below to verify your email."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {verifyEmail.isPending && (
            <div className="flex justify-center py-4">
              <svg
                className="h-8 w-8 animate-spin text-gray-900"
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
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Your email has been verified successfully. You can now sign in.
            </div>
          )}

          {verifyEmail.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {verifyEmail.error?.message ||
                "We couldn't verify your email. The link may have expired."}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center gap-3">
          {!verifyEmail.isPending && !verifyEmail.isSuccess && (
            <Button
              onClick={() => verifyEmail.mutate({ token })}
              loading={verifyEmail.isPending}
            >
              Verify Email
            </Button>
          )}
          <Link to="/sign-in">
            <Button variant="secondary">Back to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
