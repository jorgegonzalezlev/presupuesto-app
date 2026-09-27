import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request, { params }) {
  const row = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(params.id);
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { articulo = row.articulo, precio = row.precio, paid = row.paid } = await request.json();
  db.prepare('UPDATE fixed_payments SET articulo = ?, precio = ?, paid = ? WHERE id = ?').run(
    articulo,
    precio,
    paid ? 1 : 0,
    params.id
  );
  const updated = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}

export function DELETE(request, { params }) {
  db.prepare('DELETE FROM fixed_payments WHERE id = ?').run(params.id);
  return NextResponse.json(null, { status: 204 });
}
