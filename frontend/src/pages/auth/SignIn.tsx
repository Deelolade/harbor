import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Welcome back! Enter your credentials to continue.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {signIn.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
                className="text-sm text-gray-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" loading={signIn.isPending} className="w-full">
              Sign In
            </Button>
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/sign-up"
                className="font-medium text-gray-900 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
