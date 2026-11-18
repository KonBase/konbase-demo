import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/postgres';
import { hasRoleOrAbove } from '@/lib/db/rls';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Current user id + association (x-association-id header, else first membership)
export async function getCtx(req?: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  const assocs = (
    session.user as { associations?: { association: { id: string } }[] }
  ).associations;
  const associationId =
    req?.headers.get('x-association-id') || assocs?.[0]?.association.id || '';
  return { userId, associationId };
}

// Membership + minimum role check for routes that take x-association-id from the client.
// Without it any signed-in user could read/write any association by changing the header.
export async function denyUnlessRole(
  userId: string,
  associationId: string,
  min: 'member' | 'manager' | 'admin' = 'member'
): Promise<NextResponse | null> {
  const rows = await executeQuery<{ role: string }>(
    'SELECT role FROM association_members WHERE profile_id = $1 AND association_id = $2',
    [userId, associationId]
  );
  if (!rows[0] || !hasRoleOrAbove(rows[0].role, min))
    return NextResponse.json(
      { error: 'Forbidden', success: false },
      { status: 403 }
    );
  return null;
}
