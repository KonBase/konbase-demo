import { NextRequest, NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

export async function GET(req: NextRequest) {
  const ctx = await getCtx(req);
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await executeQuery(
    'SELECT id, name, description, parent_id FROM categories WHERE association_id = $1 ORDER BY name',
    [ctx.associationId]
  );
  return NextResponse.json({ data });
}
