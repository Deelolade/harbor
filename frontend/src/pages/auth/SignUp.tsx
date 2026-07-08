import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { signUpSchema, type SignUpInput } from "../../lib/validations";
import { useSignUp } from "../../hooks/use-auth";

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
  const signUp = useSignUp();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof SignUpInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignUpInput;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const { confirmPassword: _, ...data } = result.data;
    signUp.mutate(data);
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Fill in the details below to get started."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {signUp.error && (
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-sm text-red-300">
            {signUp.error.message || "Something went wrong."}
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

        <Button type="submit" loading={signUp.isPending} className="w-full">
          Create account
        </Button>

        <p className="text-center text-sm text-blue-200/50">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-blue-200 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
