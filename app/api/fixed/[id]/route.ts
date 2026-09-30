import { NextResponse, type NextRequest } from 'next/server';
import db from '@/database';

interface Fixed {
  id: number;
  articulo: string;
  precio: number;
  paid: number;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(Number(params.id)) as Fixed | undefined;
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { articulo = row.articulo, precio = row.precio, paid = row.paid } = await request.json();
  db.prepare('UPDATE fixed_payments SET articulo = ?, precio = ?, paid = ? WHERE id = ?').run(
    articulo,
    precio,
    paid ? 1 : 0,
    Number(params.id)
  );
  const updated = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(Number(params.id));
  return NextResponse.json(updated);
}

export function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  db.prepare('DELETE FROM fixed_payments WHERE id = ?').run(Number(params.id));
  return NextResponse.json(null, { status: 204 });
}
