import { NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await executeQuery(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
    [id, ctx.userId]
  );
  return NextResponse.json({ success: true });
}
