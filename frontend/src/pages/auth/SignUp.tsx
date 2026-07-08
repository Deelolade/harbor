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

  const displayError = signUp.error?.message || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Fill in the details below to get started.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {displayError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {displayError}
              </div>
            )}

            <Input
              label="Full Name"
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
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
            />
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" loading={signUp.isPending} className="w-full">
              Create Account
            </Button>
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="font-medium text-gray-900 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
