import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
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

  const displayError = acceptInvite.error?.message || "";

  if (!invitationToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              The invitation link you followed is missing a token. Please
              contact your administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/sign-in">
              <Button variant="secondary">Back to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited! Set up your account to get started.
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
            <Button
              type="submit"
              loading={acceptInvite.isPending}
              className="w-full"
            >
              Accept Invitation
            </Button>
            <p className="text-sm text-gray-500">
              <Link
                to="/sign-in"
                className="font-medium text-gray-900 hover:underline"
              >
                Back to Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
