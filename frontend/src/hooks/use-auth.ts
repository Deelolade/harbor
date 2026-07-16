import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";

/** Extract a human-readable message from better-auth's various error shapes. */
function getErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const inner = error?.error || error?.body || error;
  return inner?.message || error?.message || fallback;
}

// ── Sign In ──
export function useSignIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authClient.signIn.email(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Sign in failed."), {
        id: "auth-error",
      });
    },
    onSuccess: async (result: any) => {
      console.log("[useSignIn] result:", result);
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Sign in failed."), {
          id: "auth-error",
        });
        return;
      }
      toast.success("Signed in!", { id: "auth-success" });
      // Invalidate all cached queries so useSession() picks up the new session
      await queryClient.invalidateQueries();
      navigate(redirect || "/workspaces");
    },
  });
}

// ── Sign Up ──
export function useSignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      authClient.signUp.email(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Sign up failed."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Sign up failed."), {
          id: "auth-error",
        });
        return;
      }
      if (redirect) {
        navigate(redirect);
      } else {
        navigate("/sign-in");
      }
      toast.success(
        "Account created! Check your email to verify your account.",
        { id: "auth-success", duration: 6000 },
      );
    },
  });
}

// ── Forgot Password ──
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8800"}/api/auth/forget-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        },
      );
      if (res.status === 404 || res.status === 200) return;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Something went wrong.");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Something went wrong."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Something went wrong."), {
          id: "auth-error",
        });
        return;
      }
      toast.success("Reset link sent! Check your inbox.", {
        id: "auth-success",
      });
    },
  });
}

// ── Reset Password ──
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { newPassword: string; token?: string }) =>
      authClient.resetPassword(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Reset failed."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Reset failed."), {
          id: "auth-error",
        });
        return;
      }
      toast.success("Password reset successfully!", { id: "auth-success" });
    },
  });
}

// ── Verify Email ──
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (data: { token: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8800"}/api/auth/verify-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Verification failed.");
      return json;
    },
    onError: (error: any) => {
      toast.error(error?.message || "Verification failed.", {
        id: "auth-error",
      });
    },
    onSuccess: () => {
      toast.success("Email verified!", { id: "auth-success" });
    },
  });
}

// ── Invite Acceptance ──
export function useAcceptInvite() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      invitationToken: string;
    }) =>
      authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        fetchOptions: {
          query: { invitationToken: data.invitationToken },
        },
      } as any),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to accept invitation."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(
          getErrorMessage(result.error, "Failed to accept invitation."),
          { id: "auth-error" },
        );
        return;
      }
      toast.success("Invitation accepted!", { id: "auth-success" });
    },
  });
}
