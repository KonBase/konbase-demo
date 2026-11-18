import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDataAccess } from '@/lib/db/data-access';
import { associationSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/associations - List user's associations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // UI reads membership.association.{id,name,...} and membership.joined_at
    const dataAccess = getDataAccess();
    const rows = await dataAccess.executeQuery<{
      id: string;
      role: string;
      joined_at: string;
      association_id: string;
      name: string;
      description: string | null;
      email: string | null;
      website: string | null;
      logo_url: string | null;
    }>(
      `SELECT am.id, am.role, am.joined_at, am.association_id,
              a.name, a.description, a.email, a.website, a.logo_url
       FROM association_members am JOIN associations a ON a.id = am.association_id
       WHERE am.profile_id = $1 ORDER BY a.name`,
      [session.user.id]
    );

    const formattedAssociations = rows.map(r => ({
      id: r.id,
      role: r.role,
      joined_at: r.joined_at,
      association_id: r.association_id,
      association_name: r.name,
      association: {
        id: r.association_id,
        name: r.name,
        description: r.description,
        email: r.email,
        website: r.website,
        logo_url: r.logo_url,
      },
    }));

    return NextResponse.json({ data: formattedAssociations, success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching associations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations', success: false },
      { status: 500 }
    );
  }
}

// POST /api/associations - Create new association
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = associationSchema.parse(body);

    const dataAccess = getDataAccess();

    // Create association
    const association = await dataAccess.createAssociation({
      name: validatedData.name,
      description: validatedData.description || undefined,
      email: validatedData.email || undefined,
      website: validatedData.website || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address || undefined,
    });

    // Add creator as admin
    await dataAccess.createAssociationMember({
      association_id: association.id,
      profile_id: session.user.id,
      role: 'admin',
    });

    return NextResponse.json(
      {
        data: association,
        success: true,
        message: 'Association created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors, success: false },
        { status: 400 }
      );
    }

    // eslint-disable-next-line no-console
    console.error('Error creating association:', error);
    return NextResponse.json(
      { error: 'Failed to create association', success: false },
      { status: 500 }
    );
  }
}
