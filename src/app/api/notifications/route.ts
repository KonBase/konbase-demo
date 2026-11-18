import { NextResponse } from 'next/server';
import { getCtx } from '@/lib/api/session';
import { executeQuery } from '@/lib/db/postgres';

export async function GET() {
  const ctx = await getCtx();
  if (!ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const notifications = await executeQuery<{ read: boolean }>(
    'SELECT id, type, title, message, data, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [ctx.userId]
  );
  return NextResponse.json({
    data: {
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    },
  });
}
