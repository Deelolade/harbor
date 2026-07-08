import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
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
    <AuthLayout
      title="Forgot password"
      description="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {forgotPassword.error && (
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
            {forgotPassword.error.message ||
              "Something went wrong. Please try again."}
          </div>
        )}

        {forgotPassword.isSuccess && (
          <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/20 p-3 text-sm text-emerald-300">
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

        <Button
          type="submit"
          loading={forgotPassword.isPending}
          className="w-full"
        >
          Send reset link
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
