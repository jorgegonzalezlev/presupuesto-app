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

export function GET(request, { params }) {
  const data = getMonthFull(params.id);
  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(data);
}

export function PATCH(request, { params }) {
  return request.json().then(({ sueldo }) => {
    const month = db.prepare('SELECT * FROM months WHERE id = ?').get(params.id);
    if (!month) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    db.prepare('UPDATE months SET sueldo = ? WHERE id = ?').run(sueldo ?? month.sueldo, params.id);
    return NextResponse.json(getMonthFull(params.id));
  });
}

export function DELETE(request, { params }) {
  db.prepare('DELETE FROM months WHERE id = ?').run(params.id);
  return NextResponse.json(null, { status: 204 });
}
