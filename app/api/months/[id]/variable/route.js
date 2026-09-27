import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request, { params }) {
  const { articulo = '', precio = 0, lugar = '' } = await request.json();
  const monthId = params.id;
  const pos = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM variable_expenses WHERE month_id = ?')
    .get(monthId).p;
  const info = db
    .prepare('INSERT INTO variable_expenses (month_id, articulo, precio, lugar, position) VALUES (?, ?, ?, ?, ?)')
    .run(monthId, articulo, precio, lugar, pos);
  const row = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(row, { status: 201 });
}
