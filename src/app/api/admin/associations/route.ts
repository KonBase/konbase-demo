import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET(request: NextRequest) {
  const dataAccess = createDataAccessLayer('postgresql');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: string[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE a.name ILIKE $${paramIndex} OR a.email ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get associations with counts
    // Counts via separate GROUP BY queries (also runs on the demo DB)
    const rows = await dataAccess.executeQuery<{ id: string }>(
      `
      SELECT a.* FROM associations a
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset]
    );
    const countBy = async (table: string) =>
      dataAccess.executeQuery<{ association_id: string; n: string }>(
        `SELECT association_id, COUNT(*) AS n FROM ${table} GROUP BY association_id`
      );
    const [members, conventions, items] = await Promise.all([
      countBy('association_members'),
      countBy('conventions'),
      countBy('items'),
    ]);
    const n = (list: typeof members, id: string) =>
      Number(list.find(c => c.association_id === id)?.n ?? 0);
    const associations = rows.map(a => ({
      ...a,
      member_count: n(members, a.id),
      convention_count: n(conventions, a.id),
      item_count: n(items, a.id),
    }));

    // Get total count for pagination
    const totalCount = (await dataAccess.executeQuerySingle(
      `
      SELECT COUNT(*) as count FROM associations a
      ${whereClause}
    `,
      params
    )) as { count: number } | null;

    const totalPages = Math.ceil((totalCount?.count || 0) / limit);

    return NextResponse.json({
      data: {
        data: associations || [],
        pagination: {
          page,
          limit,
          totalCount: totalCount?.count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin associations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const dataAccess = createDataAccessLayer('postgresql');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, email, website, status = 'active' } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create association
    const association = await dataAccess.executeQuerySingle(
      `
      INSERT INTO associations (
        name, description, email, website, status
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING *
    `,
      [name, description || null, email, website || null, status]
    );

    return NextResponse.json(
      {
        data: association,
        success: true,
        message: 'Association created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create association error:', error);
    return NextResponse.json(
      { error: 'Failed to create association', success: false },
      { status: 500 }
    );
  }
}
