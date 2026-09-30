import { NextResponse, type NextRequest } from 'next/server';
import db from '@/database';

interface Variable {
  id: number;
  articulo: string;
  precio: number;
  lugar: string;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const row = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(Number(params.id)) as Variable | undefined;
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { articulo = row.articulo, precio = row.precio, lugar = row.lugar } = await request.json();
  db.prepare('UPDATE variable_expenses SET articulo = ?, precio = ?, lugar = ? WHERE id = ?').run(
    articulo,
    precio,
    lugar,
    Number(params.id)
  );
  const updated = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(Number(params.id));
  return NextResponse.json(updated);
}

export function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  db.prepare('DELETE FROM variable_expenses WHERE id = ?').run(Number(params.id));
  return NextResponse.json(null, { status: 204 });
}
