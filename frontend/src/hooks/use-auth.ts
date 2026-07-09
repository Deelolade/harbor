import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";

function handleResult<T extends { error?: { message?: string } }>(
  result: T,
  successMsg: string,
  fallbackError: string,
) {
  if (result?.error) {
    toast.error(result.error.message || fallbackError, { id: "auth-error" });
    return false;
  }
  toast.success(successMsg, { id: "auth-success" });
  return true;
}

// ── Sign In ──
export function useSignIn() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authClient.signIn.email(data),
    onError: (error: any) => {
      toast.error(
        error?.message || "Sign in failed. Please check your credentials.",
        {
          id: "auth-error",
        },
      );
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Signed in successfully!",
        "Sign in failed. Please check your credentials.",
      );
    },
  });
}

// ── Sign Up ──
export function useSignUp() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      authClient.signUp.email(data),
    onError: (error: any) => {
      toast.error(error?.message || "Sign up failed. Please try again.", {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Account created! You're all set.",
        "Sign up failed. Please try again.",
      );
    },
  });
}

// ── Forgot Password ──
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) => authClient.forgetPassword(data),
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong. Please try again.", {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Reset link sent! Check your inbox.",
        "Something went wrong. Please try again.",
      );
    },
  });
}

// ── Reset Password ──
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { newPassword: string; token?: string }) =>
      authClient.resetPassword(data),
    onError: (error: any) => {
      toast.error(
        error?.message || "Reset failed. The link may have expired.",
        {
          id: "auth-error",
        },
      );
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Password reset successfully!",
        "Reset failed. The link may have expired.",
      );
    },
  });
}

// ── Verify Email ──
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { token: string }) => authClient.verifyEmail(data),
    onError: (error: any) => {
      toast.error(
        error?.message || "Verification failed. The link may have expired.",
        {
          id: "auth-error",
        },
      );
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Email verified! You can now sign in.",
        "Verification failed. The link may have expired.",
      );
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
      toast.error(error?.message || "Failed to accept invitation.", {
        id: "auth-error",
      });
    },
    onSuccess: (result: any) => {
      handleResult(
        result,
        "Invitation accepted! Welcome aboard.",
        "Failed to accept invitation.",
      );
    },
  });
}
