import { NextRequest, NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

// One channel per association; channel id = association id
export async function GET(req: NextRequest) {
  const ctx = await getCtx(req);
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const mine = await executeQuery<{ id: string; name: string }>(
    `SELECT a.id, a.name FROM associations a
     JOIN association_members m ON m.association_id = a.id WHERE m.profile_id = $1`,
    [ctx.userId]
  );
  const rows = await Promise.all(
    mine.map(async a => ({
      ...a,
      participants: (
        await executeQuery<{ n: number }>(
          'SELECT count(*) AS n FROM association_members WHERE association_id = $1',
          [a.id]
        )
      )[0].n,
    }))
  );
  const channels = rows.map(r => ({
    id: r.id,
    name: r.name,
    type: 'association',
    unread_count: 0,
    participants: Number(r.participants),
  }));
  return NextResponse.json({ data: { channels } });
}
