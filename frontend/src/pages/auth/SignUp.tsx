import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiMail } from "react-icons/fi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import SocialButton from "../../components/auth/SocialButton";
import { signUpSchema, type SignUpInput } from "../../lib/validations";
import { useSignUp } from "../../hooks/use-auth";
import { authClient } from "../../lib/auth-client";

export default function SignUp() {
  const [form, setForm] = useState<SignUpInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignUpInput, string>>
  >({});
  const [accepted, setAccepted] = useState(false);
  const signUp = useSignUp();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const r = signUpSchema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof SignUpInput, string>> = {};
      for (const i of r.error.issues) {
        const f = i.path[0] as keyof SignUpInput;
        if (!errs[f]) errs[f] = i.message;
      }
      setFieldErrors(errs);
      return;
    }
    if (!accepted) {
      setFieldErrors({ confirmPassword: "You must accept the terms." });
      return;
    }
    const { confirmPassword: _, ...data } = r.data;
    signUp.mutate(data);
  };

  const handleSocial = async (provider: "google" | "github") => {
    await authClient.signIn.social({ provider });
  };

  return (
    <AuthLayout
      mode="signup"
      title="Create your account"
      subtitle="Start organizing projects, tasks and workflows in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-white hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <p className="text-[12px] text-zinc-600">
          Must be at least 8 characters with letters and numbers.
        </p>

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#1F1F23] bg-[#0D0E12] accent-amber-500"
          />
          <span className="text-[13px] text-zinc-400 leading-relaxed">
            I agree to the{" "}
            <span className="text-white underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-white underline cursor-pointer">
              Privacy Policy
            </span>
          </span>
        </label>

        <Button type="submit" loading={signUp.isPending} className="w-full">
          Create account
        </Button>

        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[12px] font-medium uppercase tracking-wider text-zinc-600">
            or continue with
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <SocialButton
            provider="google"
            onClick={() => handleSocial("google")}
          />
          <SocialButton
            provider="github"
            onClick={() => handleSocial("github")}
          />
        </div>
      </form>
    </AuthLayout>
  );
}
