import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dataAccess = createDataAccessLayer('postgresql');

  // Find one association for user (first membership) - could be driven by UI selector
  const memberships = await dataAccess.getAssociationMembersByProfileId(
    session.user.id
  );
  const associationId = memberships?.[0]?.association_id;

  if (!associationId) {
    return NextResponse.json({
      data: {
        totalItems: 0,
        totalConventions: 0,
        activeConventions: 0,
        upcomingConventions: 0,
        itemsNeedingAttention: 0,
        associationMembers: 0,
        recentActivity: [],
        upcomingTasks: [],
      },
    });
  }

  const count = async (sql: string) =>
    Number(
      (await dataAccess.executeQuery<{ n: string }>(sql, [associationId]))[0]
        ?.n ?? 0
    );

  const [
    totalItems,
    itemsNeedingAttention,
    associationMembers,
    totalConventions,
    activeConventions,
    upcomingConventions,
  ] = await Promise.all([
    count('SELECT COUNT(*) AS n FROM items WHERE association_id = $1'),
    count(
      "SELECT COUNT(*) AS n FROM items WHERE association_id = $1 AND condition IN ('poor','broken')"
    ),
    count(
      'SELECT COUNT(*) AS n FROM association_members WHERE association_id = $1'
    ),
    count('SELECT COUNT(*) AS n FROM conventions WHERE association_id = $1'),
    count(
      "SELECT COUNT(*) AS n FROM conventions WHERE association_id = $1 AND status = 'active'"
    ),
    count(
      "SELECT COUNT(*) AS n FROM conventions WHERE association_id = $1 AND status = 'planning' AND start_date > NOW()"
    ),
  ]);

  return NextResponse.json({
    data: {
      totalItems,
      totalConventions,
      activeConventions,
      upcomingConventions,
      itemsNeedingAttention,
      associationMembers,
      recentActivity: [],
      upcomingTasks: [],
    },
  });
}
