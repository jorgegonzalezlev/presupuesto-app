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

export function GET() {
  const months = db.prepare('SELECT id, year, month, sueldo FROM months ORDER BY year, month').all() as Month[];
  return NextResponse.json(months);
}

export async function POST(request: NextRequest) {
  const { year, month, sueldo = 0 } = await request.json();
  if (!year || !month) {
    return NextResponse.json({ error: 'year y month son requeridos' }, { status: 400 });
  }
  try {
    const info = db.prepare('INSERT INTO months (year, month, sueldo) VALUES (?, ?, ?)').run(year, month, sueldo);
    return NextResponse.json(getMonthFull(Number(info.lastInsertRowid)), { status: 201 });
  } catch (e) {
    const error = e as Error;
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Ese mes ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
