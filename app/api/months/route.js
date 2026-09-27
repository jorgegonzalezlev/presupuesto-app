import { NextResponse } from 'next/server';
import db from '@/lib/db';

function computeTotals(monthId) {
  const totalFijos = db
    .prepare('SELECT COALESCE(SUM(precio), 0) AS s FROM fixed_payments WHERE month_id = ?')
    .get(monthId).s;
  const totalVariable = db
    .prepare('SELECT COALESCE(SUM(precio), 0) AS s FROM variable_expenses WHERE month_id = ?')
    .get(monthId).s;
  const totalGastos = totalVariable + totalFijos;
  return { totalFijos, totalVariable, totalGastos };
}

function getMonthFull(monthId) {
  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(monthId);
  if (!month) return null;
  const variableExpenses = db
    .prepare('SELECT * FROM variable_expenses WHERE month_id = ? ORDER BY position, id')
    .all(monthId);
  const fixedPayments = db
    .prepare('SELECT * FROM fixed_payments WHERE month_id = ? ORDER BY position, id')
    .all(monthId);
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
  const months = db.prepare('SELECT id, year, month, sueldo FROM months ORDER BY year, month').all();
  return NextResponse.json(months);
}

export function POST(request) {
  return request.json().then(({ year, month, sueldo = 0 }) => {
    if (!year || !month) {
      return NextResponse.json({ error: 'year y month son requeridos' }, { status: 400 });
    }
    try {
      const info = db
        .prepare('INSERT INTO months (year, month, sueldo) VALUES (?, ?, ?)')
        .run(year, month, sueldo);
      return NextResponse.json(getMonthFull(info.lastInsertRowid), { status: 201 });
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        return NextResponse.json({ error: 'Ese mes ya existe' }, { status: 409 });
      }
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  });
}
