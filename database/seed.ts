import type { DatabaseSync } from 'node:sqlite';

export function seedIfEmpty(db: DatabaseSync): void {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM months').get() as { c: number }).c;
  if (count > 0) return;

  const now = new Date();
  const insertMonth = db.prepare('INSERT INTO months (year, month, sueldo) VALUES (?, ?, ?)');
  const monthId = Number(insertMonth.run(now.getFullYear(), now.getMonth() + 1, 4115578).lastInsertRowid);

  const insertVar = db.prepare(
    'INSERT INTO variable_expenses (month_id, articulo, precio, lugar, position) VALUES (?, ?, ?, ?, ?)'
  );
  [
    ['verdura', 40000, ''],
    ['carniceria', 40000, ''],
    ['gastos varios', 127000, ''],
  ].forEach(([articulo, precio, lugar], i) => insertVar.run(monthId, articulo, precio, lugar, i));

  const insertFixed = db.prepare(
    'INSERT INTO fixed_payments (month_id, articulo, precio, paid, position) VALUES (?, ?, ?, ?, ?)'
  );
  [
    ['diezmo', 411558, 1],
    ['elias', 80000, 0],
    ['letra casa elias', 0, 0],
    ['mundo pacifico', 31990, 1],
    ['plan lobo', 24000, 1],
    ['plan loba', 16990, 1],
    ['lobita', 120000, 1],
    ['falabella', 212520, 1],
    ['cuota abogados', 100000, 1],
    ['casa', 100000, 1],
    ['netflix', 12990, 0],
    ['youtube premium', 0, 0],
    ['amazon music', 0, 1],
    ['crunchy', 4990, 0],
  ].forEach(([articulo, precio, paid], i) => insertFixed.run(monthId, articulo, precio, paid, i));
}
