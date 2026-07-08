import { useMutation } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";

// ── Sign In ──
export function useSignIn() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authClient.signIn.email(data),
    onSuccess: () => navigate("/"),
  });
}

// ── Sign Up ──
export function useSignUp() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
    }) => authClient.signUp.email(data),
    onSuccess: () => navigate("/"),
  });
}

// ── Forgot Password ──
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      authClient.forgetPassword(data),
  });
}

// ── Reset Password ──
export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { newPassword: string; token?: string }) =>
      authClient.resetPassword(data),
    onSuccess: () => navigate("/sign-in"),
  });
}

// ── Verify Email ──
export function useVerifyEmail() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { token: string }) =>
      authClient.verifyEmail(data),
    onSuccess: () => navigate("/sign-in"),
  });
}

// ── Invite Acceptance (sign-up with invitation token) ──
export function useAcceptInvite() {
  const navigate = useNavigate();
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
        // Pass invitation token as a query param / fetch option
        // This mirrors the common better-auth pattern
        fetchOptions: {
          query: { invitationToken: data.invitationToken },
        },
      } as any),
    onSuccess: () => navigate("/"),
  });
}
