import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../../lib/validations";
import { useForgotPassword } from "../../hooks/use-auth";

export default function ForgotPassword() {
  const [form, setForm] = useState<ForgotPasswordInput>({ email: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const forgot = useForgotPassword();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const r = forgotPasswordSchema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      for (const i of r.error.issues) {
        const f = i.path[0] as keyof ForgotPasswordInput;
        if (!errs[f]) errs[f] = i.message;
      }
      setFieldErrors(errs);
      return;
    }
    forgot.mutate(r.data);
  };

  return (
    <AuthLayout
      mode="signin"
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/sign-in" className="font-semibold text-white hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<FiMail size={18} />}
          value={form.email}
          onChange={e => setForm({ email: e.target.value })}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <Button type="submit" loading={forgot.isPending} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
