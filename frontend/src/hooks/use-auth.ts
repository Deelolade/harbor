import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";

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
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authClient.signIn.email(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Sign in failed."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Sign in failed."), {
          id: "auth-error",
        });
        return;
      }
      toast.success("Signed in successfully!", { id: "auth-success" });
    },
  });
}

// ── Sign Up ──
export function useSignUp() {
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
      toast.success("Account created!", { id: "auth-success" });
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
    mutationFn: (data: { token: string }) => authClient.verifyEmail(data),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Verification failed."), {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      if (result?.error) {
        toast.error(getErrorMessage(result.error, "Verification failed."), {
          id: "auth-error",
        });
        return;
      }
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
