import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request, { params }) {
  const row = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(params.id);
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { articulo = row.articulo, precio = row.precio, lugar = row.lugar } = await request.json();
  db.prepare('UPDATE variable_expenses SET articulo = ?, precio = ?, lugar = ? WHERE id = ?').run(
    articulo,
    precio,
    lugar,
    params.id
  );
  const updated = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}

export function DELETE(request, { params }) {
  db.prepare('DELETE FROM variable_expenses WHERE id = ?').run(params.id);
  return NextResponse.json(null, { status: 204 });
}
