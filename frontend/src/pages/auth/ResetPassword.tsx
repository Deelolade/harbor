import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
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

  return (
    <AuthLayout
      title="Reset password"
      description="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {resetPassword.error && (
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
            {resetPassword.error.message || "Something went wrong."}
          </div>
        )}

        {resetPassword.isSuccess && (
          <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/20 p-3 text-sm text-emerald-300">
            Your password has been reset successfully!
          </div>
        )}

        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          error={fieldErrors.newPassword}
          autoComplete="new-password"
        />

        <Input
          label="Confirm new password"
          type="password"
          placeholder="Re-enter your new password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          loading={resetPassword.isPending}
          className="w-full"
        >
          Reset password
        </Button>

        <p className="text-center text-sm">
          <Link
            to="/sign-in"
            className="font-semibold text-blue-200 hover:text-white transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
