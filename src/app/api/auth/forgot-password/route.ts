import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { randomBytes } from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generic success message to prevent user enumeration
    // (Don't reveal whether the email exists in the database)
    const successMessage = "If an account with that email exists, we've sent a password reset link.";

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({ message: successMessage });
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `reset:${email}`,
      },
    });

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour from now

    // Create reset token in database
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`, // Prefix with "reset:" to distinguish from verification tokens
        token,
        expires,
      },
    });

    // Send password reset email
    const result = await sendPasswordResetEmail(email, user.name || "there", token);

    if (!result.success) {
      console.error("Failed to send password reset email");
      // Still return success to prevent enumeration
    }

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
