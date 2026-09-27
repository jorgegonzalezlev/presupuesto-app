import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request, { params }) {
  const { articulo = '', precio = 0, paid = 0 } = await request.json();
  const monthId = params.id;
  const pos = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM fixed_payments WHERE month_id = ?')
    .get(monthId).p;
  const info = db
    .prepare('INSERT INTO fixed_payments (month_id, articulo, precio, paid, position) VALUES (?, ?, ?, ?, ?)')
    .run(monthId, articulo, precio, paid ? 1 : 0, pos);
  const row = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(row, { status: 201 });
}
