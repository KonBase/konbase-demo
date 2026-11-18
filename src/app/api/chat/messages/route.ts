import { NextRequest, NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

async function isMember(userId: string, associationId: string) {
  const r = await executeQuery(
    'SELECT 1 FROM association_members WHERE profile_id = $1 AND association_id = $2',
    [userId, associationId]
  );
  return r.length > 0;
}

export async function GET(req: NextRequest) {
  const ctx = await getCtx(req);
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const channel = req.nextUrl.searchParams.get('channel') || ctx.associationId;
  if (!(await isMember(ctx.userId, channel)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const messages = await executeQuery(
    `SELECT m.id, m.message AS content, m.sender_id AS user_id, p.display_name AS user_name,
            m.created_at, 'text' AS message_type, m.association_id
     FROM chat_messages m JOIN profiles p ON p.user_id = m.sender_id
     WHERE m.association_id = $1 ORDER BY m.created_at ASC LIMIT 100`,
    [channel]
  );
  return NextResponse.json({ data: { messages } });
}

export async function POST(req: NextRequest) {
  const ctx = await getCtx(req);
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const channel: string = body.channel_id || ctx.associationId;
  const content = String(body.content ?? body.message ?? '').trim();
  if (!content)
    return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  if (!(await isMember(ctx.userId, channel)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await executeQuery(
    'INSERT INTO chat_messages (association_id, sender_id, message) VALUES ($1, $2, $3)',
    [channel, ctx.userId, content]
  );
  return NextResponse.json({ success: true });
}
