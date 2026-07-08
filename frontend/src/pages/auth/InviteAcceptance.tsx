import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FiUser, FiMail } from "react-icons/fi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import {
  inviteAcceptanceSchema,
  type InviteAcceptanceInput,
} from "../../lib/validations";
import { useAcceptInvite } from "../../hooks/use-auth";

export default function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token") || "";

  const [form, setForm] = useState<InviteAcceptanceInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationToken,
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof InviteAcceptanceInput, string>>
  >({});
  const accept = useAcceptInvite();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const r = inviteAcceptanceSchema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof InviteAcceptanceInput, string>> = {};
      for (const i of r.error.issues) {
        const f = i.path[0] as keyof InviteAcceptanceInput;
        if (!errs[f]) errs[f] = i.message;
      }
      setFieldErrors(errs);
      return;
    }
    const { confirmPassword: _, ...data } = r.data;
    accept.mutate(data);
  };

  return (
    <AuthLayout
      mode="signup"
      title="Accept invitation"
      subtitle="You've been invited! Set up your account to get started."
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
        {accept.error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[14px] text-red-400">
            {accept.error.message || "Something went wrong."}
          </div>
        )}

        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          icon={<FiUser size={18} />}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={fieldErrors.name}
          autoComplete="name"
        />

        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          icon={<FiMail size={18} />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" loading={accept.isPending} className="w-full">
          Accept invitation
        </Button>
      </form>
    </AuthLayout>
  );
}
