import { NextRequest } from 'next/server';
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
