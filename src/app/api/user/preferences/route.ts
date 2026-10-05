import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = preferencesSchema.parse(body);

    // For now, we'll just return success
    // In a real implementation, you would store these in a UserPreferences table
    // or add preference fields to the User model

    // TODO: Store preferences in database
    // await prisma.userPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: validatedData,
    //   create: {
    //     userId: session.user.id,
    //     ...validatedData,
    //   },
    // });

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
