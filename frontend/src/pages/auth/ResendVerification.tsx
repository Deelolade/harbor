import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import { toast } from "sonner";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
          credentials: "include",
        },
      );
      setLoading(false);

      if (res.ok) {
        toast.success(
          "If your account exists, we've sent a new verification link.",
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      setLoading(false);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthLayout
      mode="signin"
      title="Resend verification"
      subtitle="Enter your email and we'll send you a new verification link."
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
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<FiMail size={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <Button type="submit" loading={loading} className="w-full">
          Send verification link
        </Button>
      </form>
    </AuthLayout>
  );
}
