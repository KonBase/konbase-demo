import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { denyUnlessRole } from '@/lib/api/session';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { equipmentSetSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/inventory/equipment-sets - List equipment sets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const denied = await denyUnlessRole(
      session.user.id,
      associationId,
      'member'
    );
    if (denied) return denied;

    let whereClause = 'WHERE es.association_id = $1';
    const params = [associationId];
    let paramIndex = 2;

    if (query) {
      whereClause += ` AND es.name ILIKE $${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    // Two plain queries instead of json_agg (also runs on the in-memory demo DB)
    const sets = await dataAccess.executeQuery<{ id: string }>(
      `SELECT es.* FROM equipment_sets es ${whereClause} ORDER BY es.created_at DESC`,
      params
    );
    const links = sets.length
      ? await dataAccess.executeQuery<{
          id: string;
          equipment_set_id: string;
          item_id: string;
          quantity: number;
          name: string;
          description: string | null;
          condition: string;
        }>(
          `SELECT esi.id, esi.equipment_set_id, esi.item_id, esi.quantity,
                  i.name, i.description, i.condition
           FROM equipment_set_items esi JOIN items i ON esi.item_id = i.id
           WHERE esi.equipment_set_id IN (${sets.map((_, n) => `$${n + 1}`).join(',')})`,
          sets.map(s => s.id)
        )
      : [];
    const equipmentSets = sets.map(set => ({
      ...set,
      items: links
        .filter(l => l.equipment_set_id === set.id)
        .map(l => ({
          id: l.id,
          itemId: l.item_id,
          quantity: l.quantity,
          item: {
            id: l.item_id,
            name: l.name,
            description: l.description,
            condition: l.condition,
          },
        })),
    }));

    return NextResponse.json({ data: equipmentSets, success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching equipment sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment sets', success: false },
      { status: 500 }
    );
  }
}

// POST /api/inventory/equipment-sets - Create new equipment set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const body = await request.json();
    const validatedData = equipmentSetSchema.parse(body);

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const denied = await denyUnlessRole(
      session.user.id,
      associationId,
      'manager'
    );
    if (denied) return denied;

    // Create equipment set
    const equipmentSet = (await dataAccess.executeQuerySingle(
      `
      INSERT INTO equipment_sets (
        association_id, 
        name, 
        description
      ) VALUES (
        $1, $2, $3
      )
      RETURNING *
    `,
      [associationId, validatedData.name, validatedData.description || null]
    )) as { id: string } | null;

    // Add items to the set
    if (equipmentSet && validatedData.items && validatedData.items.length > 0) {
      for (const item of validatedData.items) {
        await dataAccess.executeQuery(
          `
          INSERT INTO equipment_set_items (
            equipment_set_id, 
            item_id, 
            quantity
          ) VALUES (
            $1, $2, $3
          )
        `,
          [equipmentSet.id, item.itemId, item.quantity]
        );
      }
    }

    return NextResponse.json(
      {
        data: equipmentSet,
        success: true,
        message: 'Equipment set created successfully',
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
    console.error('Error creating equipment set:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment set', success: false },
      { status: 500 }
    );
  }
}
