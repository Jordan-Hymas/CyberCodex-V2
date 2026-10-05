import { Resend } from "resend";

let client: Resend | null = null;

/**
 * Lazily create the Resend client so a missing API key only affects
 * email sending, not module import (which would break builds).
 */
export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Email functionality will not work.");
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@cybercodex.io";
