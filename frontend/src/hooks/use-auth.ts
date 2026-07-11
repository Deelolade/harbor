import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authClient, refreshSession, FRONTEND_URL } from "../lib/auth-client";

/** Extract a human-readable message from better-auth's various error shapes. */
function getErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  // better-auth often wraps errors: { error: { message } } or { body: { message } }
  const inner = error?.error || error?.body || error;
  return inner?.message || error?.message || fallback;
}

// ── Sign In ──
export function useSignIn() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authClient.signIn.email(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Sign in failed."), {
        id: "auth-error",
      });
    },
    onSuccess: async (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Sign in failed."), {
          id: "auth-error",
        });
        return;
      }
      toast.success("Signed in!", { id: "auth-success" });
      await refreshSession();
      navigate("/workspace");
    },
  });
}

// ── Sign Up ──
export function useSignUp() {
  const navigate = useNavigate();
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
      navigate("/sign-in");
      toast.success(
        "Account created! Check your email to verify your account.",
        {
          id: "auth-success",
          duration: 6000,
        },
      );
    },
  });
}

// ── Forgot Password ──
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) => authClient.forgetPassword(data),
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
