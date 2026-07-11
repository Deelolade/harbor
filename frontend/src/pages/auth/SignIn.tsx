import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import SocialButton from "../../components/auth/SocialButton";
import { signInSchema, type SignInInput } from "../../lib/validations";
import { useSignIn } from "../../hooks/use-auth";
import { authClient } from "../../lib/auth-client";

export default function SignIn() {
  const [form, setForm] = useState<SignInInput>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignInInput, string>>
  >({});
  const [remember, setRemember] = useState(false);
  const signIn = useSignIn();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const r = signInSchema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof SignInInput, string>> = {};
      for (const i of r.error.issues) {
        const f = i.path[0] as keyof SignInInput;
        if (!errs[f]) errs[f] = i.message;
      }
      setFieldErrors(errs);
      return;
    }
    signIn.mutate(r.data);
  };

  const handleSocial = async (provider: "google" | "github") => {
    await authClient.signIn.social({ provider });
  };

  return (
    <AuthLayout
      mode="signin"
      title="Welcome back"
      subtitle="Sign in to continue managing your workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/sign-up"
            className="font-semibold text-white hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<FiMail size={18} />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[#1F1F23] bg-[#0A0A0A] accent-[#2563EB]"
            />
            <span className="text-[13px] text-zinc-400">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="text-center">
          <Link
            to="/resend-verification"
            className="text-[13px] text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Didn't receive a verification email? Resend
          </Link>
        </div>

        <Button type="submit" loading={signIn.isPending} className="w-full">
          Sign in
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
