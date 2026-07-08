import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "../../lib/validations";
import { useResetPassword } from "../../hooks/use-auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState<ResetPasswordInput>({
    token,
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ResetPasswordInput, string>>
  >({});
  const resetPassword = useResetPassword();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = resetPasswordSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof ResetPasswordInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ResetPasswordInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const { confirmPassword: _, ...data } = result.data;
    resetPassword.mutate(data);
  };

  const displayError = resetPassword.error?.message || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {displayError}
              </div>
            )}

            {resetPassword.isSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Your password has been reset successfully!
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              error={fieldErrors.newPassword}
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
            />
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              loading={resetPassword.isPending}
              className="w-full"
            >
              Reset Password
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
