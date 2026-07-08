import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../../lib/validations";
import { useForgotPassword } from "../../hooks/use-auth";

export default function ForgotPassword() {
  const [form, setForm] = useState<ForgotPasswordInput>({ email: "" });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordInput, string>>
  >({});
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = forgotPasswordSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ForgotPasswordInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    forgotPassword.mutate(result.data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {forgotPassword.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {forgotPassword.error.message ||
                  "Something went wrong. Please try again."}
              </div>
            )}

            {forgotPassword.isSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                If an account with that email exists, we&apos;ve sent a password
                reset link. Please check your inbox.
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ email: e.target.value })}
              error={fieldErrors.email}
              autoComplete="email"
            />
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              loading={forgotPassword.isPending}
              className="w-full"
            >
              Send Reset Link
            </Button>
            <p className="text-sm text-gray-500">
              <Link
                to="/sign-in"
                className="font-medium text-gray-900 hover:underline"
              >
                Back to Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
