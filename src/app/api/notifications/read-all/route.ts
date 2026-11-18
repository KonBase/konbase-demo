import { NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

export async function PATCH() {
  const ctx = await getCtx();
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await executeQuery(
    'UPDATE notifications SET read = true WHERE user_id = $1',
    [ctx.userId]
  );
  return NextResponse.json({ success: true });
}
