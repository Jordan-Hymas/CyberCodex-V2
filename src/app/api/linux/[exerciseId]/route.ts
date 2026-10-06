import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { labAction, LabError } from '@/lib/linux/service';
export const runtime = 'nodejs';
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('open') }),
  z.object({ action: z.literal('command'), version: z.number().int().nonnegative(), command: z.string().min(1).max(2048) }),
  z.object({ action: z.literal('submit'), version: z.number().int().nonnegative(), flag: z.string().min(1).max(160) }),
  z.object({ action: z.literal('reset'), version: z.number().int().nonnegative() }),
  // Tab completion and nano editor helpers
  z.object({ action: z.literal('complete'), path: z.string().max(1024) }),
  z.object({ action: z.literal('read'), path: z.string().min(1).max(1024) }),
  z.object({ action: z.literal('save'), version: z.number().int().nonnegative(), path: z.string().min(1).max(1024), content: z.string().max(65536) }),
]);
// A saved file can be 64 KiB; JSON escaping can roughly double that.
const MAX_BODY = 140_000;
export async function POST(request: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return response({ error: 'Invalid request origin.' }, 403);
    const session = await auth();
    if (!session?.user?.id) return response({ error: 'Sign in to use your personal Linux environment.' }, 401);
    if (Number(request.headers.get('content-length')) > MAX_BODY) return response({ error: 'Request too large.' }, 413);
    const text = await request.text();
    if (text.length > MAX_BODY) return response({ error: 'Request too large.' }, 413);
    const data = schema.parse(JSON.parse(text));
    const { exerciseId } = await params;
    return response(await labAction(session.user.id, exerciseId, data));
  } catch (error) {
    if (error instanceof LabError) return response({ error: error.message }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return response({ error: 'Invalid lab request.' }, 400);
    console.error('Linux lab request failed', error);
    return response({ error: 'The lab could not save this request. Please reopen the mission and try again.' }, 503);
  }
}
