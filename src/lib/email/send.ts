import { getResend, FROM_EMAIL } from "./resend";
import { getVerificationEmailHtml, getPasswordResetEmailHtml, getWelcomeEmailHtml } from "./templates";

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify Your Email - CyberCodex.io",
      html: getVerificationEmailHtml({ name, verificationUrl }),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset Your Password - CyberCodex.io",
      html: getPasswordResetEmailHtml({ name, resetUrl }),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${baseUrl}/dashboard`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to CyberCodex.io! 🎉",
      html: getWelcomeEmailHtml({ name, dashboardUrl }),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}
