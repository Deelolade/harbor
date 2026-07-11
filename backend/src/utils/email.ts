import { createElement } from "react";
import { render } from "@react-email/render";
import { SendByte } from "@sendbyte/node";
import { SENDBYTE_SECRET } from "./env.js";
import VerifyEmail from "../emails/verify-email.js";
import ResetPassword from "../emails/reset-password.js";

const sendbyte = new SendByte(SENDBYTE_SECRET);

const FROM = process.env.EMAIL_FROM || "Harbor <noreply@deelolade.com.ng>";

async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[email] Sending "${subject}" to ${to}...`);
  try {
    const { id } = await sendbyte.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log(`[email] ✅ Queued — ID: ${id}`);
    return id;
  } catch (err: any) {
    console.error(`[email] ❌ Failed to send to ${to}:`, err?.message || err);
    // Log the full error so SendByte's rejection reason is visible
    if (err?.code) console.error(`[email]   Code: ${err.code}`);
    if (err?.docsUrl) console.error(`[email]   Docs: ${err.docsUrl}`);
    throw err;
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  console.log(`[email] Verification URL: ${url}`);
  const html = await render(createElement(VerifyEmail, { url }));
  return sendEmail(to, "Verify your email address", html);
}

export async function sendPasswordResetEmail(to: string, url: string) {
  console.log(`[email] Reset URL: ${url}`);
  const html = await render(createElement(ResetPassword, { url }));
  return sendEmail(to, "Reset your password", html);
}
