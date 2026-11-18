import { newDb, DataType } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { migrations } from './migrations';

// Demo mode = no real database configured. pg-mem (pure-JS Postgres emulator,
// runs on Workers) executes the real migrations + seed data, so the app's SQL keeps working.
export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === 'true' ||
    (!process.env.POSTGRES_URL && !process.env.DATABASE_URL)
  );
}

export const DEMO_PASSWORD = 'password123';

const ASSOC = '00000000-0000-4000-8000-0000000000a1';
const U = {
  admin: '00000000-0000-4000-8000-000000000001',
  manager: '00000000-0000-4000-8000-000000000002',
  member: '00000000-0000-4000-8000-000000000003',
};
const day = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString();
const CONV = '00000000-0000-4000-8000-0000000000c1';

type Q = { query: (sql: string, p?: unknown[]) => Promise<{ rows: any[] }> };

async function seed(db: Q) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 4); // low cost: demo only
  const users: [string, string, string, string, string][] = [
    [U.admin, 'admin@konbase.cfd', 'super_admin', 'Admin', 'User'],
    [U.manager, 'manager@konbase.cfd', 'manager', 'Manager', 'User'],
    [U.member, 'member@konbase.cfd', 'member', 'Member', 'User'],
  ];
  for (const [id, email, role, first, last] of users) {
    await db.query(
      `INSERT INTO users (id, email, hashed_password, role, email_verified) VALUES ($1,$2,$3,$4,now())`,
      [id, email, hash, role]
    );
    await db.query(
      `INSERT INTO profiles (user_id, first_name, last_name, display_name) VALUES ($1,$2,$3,$4)`,
      [id, first, last, `${first} ${last}`]
    );
  }
  await db.query(
    `INSERT INTO associations (id, name, description, email, website) VALUES ($1,'Demo Association','Demo fantasy club & convention organizers','demo@konbase.cfd','https://konbase.cfd')`,
    [ASSOC]
  );
  for (const [id, , role] of users) {
    await db.query(
      `INSERT INTO association_members (association_id, profile_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [ASSOC, id, role === 'super_admin' ? 'admin' : role]
    );
  }
  const cats = ['Lighting', 'Audio', 'Furniture'];
  const locs = ['Main Storage', 'Stage', 'Van'];
  const catIds: string[] = [];
  const locIds: string[] = [];
  for (const n of cats) {
    const r = await db.query(
      `INSERT INTO categories (association_id, name, path) VALUES ($1,$2,$2) RETURNING id`,
      [ASSOC, n]
    );
    catIds.push(r.rows[0].id);
  }
  for (const n of locs) {
    const r = await db.query(
      `INSERT INTO locations (association_id, name, path) VALUES ($1,$2,$2) RETURNING id`,
      [ASSOC, n]
    );
    locIds.push(r.rows[0].id);
  }
  const items: [string, number, number, string][] = [
    ['LED Par Can', 0, 0, 'good'],
    ['Moving Head Spot', 0, 1, 'excellent'],
    ['PA Speaker 12"', 1, 1, 'good'],
    ['Wireless Microphone', 1, 0, 'fair'],
    ['Mixing Console', 1, 1, 'excellent'],
    ['Folding Table', 2, 2, 'good'],
    ['Stackable Chair', 2, 2, 'fair'],
    ['Extension Cable 10m', 0, 0, 'poor'],
  ];
  for (const [name, c, l, cond] of items) {
    await db.query(
      `INSERT INTO items (association_id, name, description, category_id, location_id, condition, serial_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        ASSOC,
        name,
        `${name} (demo item)`,
        catIds[c],
        locIds[l],
        cond,
        `SN-${Math.floor(Math.random() * 90000 + 10000)}`,
      ]
    );
  }
  const set = await db.query(
    `INSERT INTO equipment_sets (association_id, name, description) VALUES ($1,'Stage Lighting Kit','Basic lighting bundle for a small stage') RETURNING id`,
    [ASSOC]
  );
  const lightIds = await db.query(
    `SELECT id FROM items WHERE association_id = $1 AND category_id = $2`,
    [ASSOC, catIds[0]]
  );
  for (const row of lightIds.rows)
    await db.query(
      `INSERT INTO equipment_set_items (equipment_set_id, item_id, quantity) VALUES ($1,$2,2)`,
      [set.rows[0].id, row.id]
    );
  await db.query(
    `INSERT INTO conventions (id, association_id, name, description, start_date, end_date, location, status)
     VALUES ($1,$2,'KonDemo 2027','Annual demo convention', $4, $5,'Kraków Expo','planning'),
            ($3,$2,'Winter Meetup','Small winter gathering', $6, $7,'Community Hall','completed')`,
    [
      CONV,
      ASSOC,
      '00000000-0000-4000-8000-0000000000c2',
      day(60),
      day(62),
      day(-30),
      day(-29),
    ]
  );
  await db.query(
    `INSERT INTO convention_members (convention_id, profile_id, role) VALUES ($1,$2,'organizer')`,
    [CONV, U.admin]
  );
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,'Welcome to KonBase demo','Everything here is mock data and resets on restart.','info')`,
    [U.admin]
  );
  await db.query(
    `INSERT INTO system_settings (key, value) VALUES ('setup_complete','true')`
  );
}

// pg-mem has no plpgsql/triggers/RLS/extensions: drop those statements.
// citext -> text (the app already lower-cases emails); gen_random_uuid is registered below.
const demoStatements = (sql: string) =>
  sql
    .replace(
      /CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*language\s*'?plpgsql'?;/gi,
      ''
    )
    .replace(/\bcitext\b/g, 'text')
    // pg-mem can't compare date with timestamptz (reports do `warranty_expires < NOW()`)
    .replace(/\b(purchase_date|warranty_expires) date\b/g, '$1 timestamptz')
    .replace(/\b(decimal|numeric)\(\d+,\s*\d+\)/gi, '$1')
    .split(';')
    .map(st => st.replace(/--.*$/gm, '').trim())
    .filter(
      st =>
        st &&
        !/^(CREATE (EXTENSION|TRIGGER|POLICY)|ALTER TABLE .* ENABLE ROW LEVEL SECURITY|CREATE OR REPLACE FUNCTION)/i.test(
          st
        )
    );

let dbPromise: Promise<Q> | null = null;

export function getDemoDb(): Promise<Q> {
  dbPromise ??= (async () => {
    const mem = newDb();
    mem.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.uuid,
      implementation: () => crypto.randomUUID(),
      impure: true,
    });
    mem.public.registerFunction({
      name: 'date', // reports use DATE(created_at)
      args: [DataType.timestamptz],
      returns: DataType.date,
      implementation: (d: Date) => new Date(d.toISOString().slice(0, 10)),
    });
    mem.public.registerFunction({
      name: 'char_length',
      args: [DataType.text],
      returns: DataType.integer,
      implementation: (t: string) => t.length,
    });
    const db = new (mem.adapters.createPg().Pool)() as unknown as Q;
    for (const m of migrations)
      for (const st of demoStatements(m.up)) mem.public.none(st);
    mem.public.none(
      `CREATE TABLE IF NOT EXISTS schema_migrations (version varchar(255) PRIMARY KEY, applied_at timestamptz DEFAULT now() NOT NULL)`
    );
    for (const m of migrations)
      await db.query(`INSERT INTO schema_migrations (version) VALUES ($1)`, [
        m.version,
      ]);
    await seed(db);
    return db;
  })();
  return dbPromise;
}

export async function demoQuery<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDemoDb();
  return (await db.query(sql, params)).rows as T[];
}
