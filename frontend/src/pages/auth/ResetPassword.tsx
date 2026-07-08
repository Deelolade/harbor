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
  const reset = useResetPassword();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const r = resetPasswordSchema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof ResetPasswordInput, string>> = {};
      for (const i of r.error.issues) {
        const f = i.path[0] as keyof ResetPasswordInput;
        if (!errs[f]) errs[f] = i.message;
      }
      setFieldErrors(errs);
      return;
    }
    const { confirmPassword: _, ...data } = r.data;
    reset.mutate(data);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={
        <Link
          to="/sign-in"
          className="font-semibold text-white hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {reset.error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[14px] text-red-400">
            {reset.error.message || "Something went wrong."}
          </div>
        )}
        {reset.isSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[14px] text-emerald-400">
            Password reset successfully!
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
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" loading={reset.isPending} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
