import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isDevAdmin, setDevAdminPro } from "@/lib/auth/dev-admin";
import { z } from "zod";

/** TEMPORARY: dev admin's paid-access toggle. Remove with dev-admin.ts before launch. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isDevAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = z.object({ enabled: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { enabled: boolean }" }, { status: 400 });
  }

  const user = await setDevAdminPro(parsed.data.enabled);
  return NextResponse.json({ subscriptionTier: user?.subscriptionTier });
}
