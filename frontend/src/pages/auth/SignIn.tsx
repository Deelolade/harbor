import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { signInSchema, type SignInInput } from "../../lib/validations";
import { useSignIn } from "../../hooks/use-auth";

export default function SignIn() {
  const [form, setForm] = useState<SignInInput>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignInInput, string>>
  >({});
  const signIn = useSignIn();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = signInSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof SignInInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignInInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    signIn.mutate(result.data);
  };

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back! Enter your credentials to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {signIn.error && (
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
            {signIn.error.message || "Sign in failed. Please try again."}
          </div>
        )}

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
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-300/80 hover:text-blue-200 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={signIn.isPending} className="w-full">
          Sign in
        </Button>

        <p className="text-center text-sm text-blue-200/50">
          Don&apos;t have an account?{" "}
          <Link
            to="/sign-up"
            className="font-semibold text-blue-200 hover:text-white transition-colors"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
