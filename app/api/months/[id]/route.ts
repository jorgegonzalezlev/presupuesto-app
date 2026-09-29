import { NextResponse, type NextRequest } from 'next/server';
import db from '@/lib/db';

function computeTotals(monthId: number): { totalFijos: number; totalVariable: number; totalGastos: number } {
  const totalFijos = (
    db.prepare('SELECT COALESCE(SUM(precio), 0) AS s FROM fixed_payments WHERE month_id = ?').get(monthId) as {
      s: number;
    }
  ).s;
  const totalVariable = (
    db.prepare('SELECT COALESCE(SUM(precio), 0) AS s FROM variable_expenses WHERE month_id = ?').get(monthId) as {
      s: number;
    }
  ).s;
  const totalGastos = totalVariable + totalFijos;
  return { totalFijos, totalVariable, totalGastos };
}

interface Month {
  id: number;
  year: number;
  month: number;
  sueldo: number;
}

function getMonthFull(monthId: number): any {
  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(monthId) as Month | undefined;
  if (!month) return null;
  const variableExpenses = db.prepare('SELECT * FROM variable_expenses WHERE month_id = ? ORDER BY position, id').all(monthId);
  const fixedPayments = db.prepare('SELECT * FROM fixed_payments WHERE month_id = ? ORDER BY position, id').all(monthId);
  const { totalFijos, totalGastos } = computeTotals(monthId);
  const actual = month.sueldo - totalGastos;
  return {
    ...month,
    variableExpenses,
    fixedPayments,
    totals: { totalFijos, totalGastos, actual },
  };
}

export function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const data = getMonthFull(Number(params.id));
  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { sueldo } = await request.json();
  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(Number(params.id)) as Month | undefined;
  if (!month) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  db.prepare('UPDATE months SET sueldo = ? WHERE id = ?').run(sueldo ?? month.sueldo, Number(params.id));
  return NextResponse.json(getMonthFull(Number(params.id)));
}

export function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  db.prepare('DELETE FROM months WHERE id = ?').run(Number(params.id));
  return NextResponse.json(null, { status: 204 });
}
