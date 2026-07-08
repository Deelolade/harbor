import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  const acceptInvite = useAcceptInvite();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = inviteAcceptanceSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof InviteAcceptanceInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof InviteAcceptanceInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const { confirmPassword: _, ...data } = result.data;
    acceptInvite.mutate(data);
  };

  return (
    <AuthLayout
      title="Accept invitation"
      description="You've been invited! Set up your account to get started."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {acceptInvite.error && (
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
            {acceptInvite.error.message || "Something went wrong."}
          </div>
        )}

        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={fieldErrors.name}
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
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

        <Button
          type="submit"
          loading={acceptInvite.isPending}
          className="w-full"
        >
          Accept invitation
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
