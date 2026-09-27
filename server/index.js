import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

// --- Months ---

app.get('/api/months', (req, res) => {
  const months = db.prepare('SELECT id, year, month, sueldo FROM months ORDER BY year, month').all();
  res.json(months);
});

app.post('/api/months', (req, res) => {
  const { year, month, sueldo = 0 } = req.body;
  if (!year || !month) return res.status(400).json({ error: 'year y month son requeridos' });
  try {
    const info = db
      .prepare('INSERT INTO months (year, month, sueldo) VALUES (?, ?, ?)')
      .run(year, month, sueldo);
    res.status(201).json(getMonthFull(info.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ese mes ya existe' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/months/:id', (req, res) => {
  const data = getMonthFull(req.params.id);
  if (!data) return res.status(404).json({ error: 'No encontrado' });
  res.json(data);
});

app.patch('/api/months/:id', (req, res) => {
  const { sueldo } = req.body;
  const month = db.prepare('SELECT * FROM months WHERE id = ?').get(req.params.id);
  if (!month) return res.status(404).json({ error: 'No encontrado' });
  db.prepare('UPDATE months SET sueldo = ? WHERE id = ?').run(sueldo ?? month.sueldo, req.params.id);
  res.json(getMonthFull(req.params.id));
});

app.delete('/api/months/:id', (req, res) => {
  db.prepare('DELETE FROM months WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Variable expenses (articulos) ---

app.post('/api/months/:id/variable', (req, res) => {
  const { articulo = '', precio = 0, lugar = '' } = req.body;
  const monthId = req.params.id;
  const pos = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM variable_expenses WHERE month_id = ?')
    .get(monthId).p;
  const info = db
    .prepare('INSERT INTO variable_expenses (month_id, articulo, precio, lugar, position) VALUES (?, ?, ?, ?, ?)')
    .run(monthId, articulo, precio, lugar, pos);
  res.status(201).json(db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(info.lastInsertRowid));
});

app.patch('/api/variable/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No encontrado' });
  const { articulo = row.articulo, precio = row.precio, lugar = row.lugar } = req.body;
  db.prepare('UPDATE variable_expenses SET articulo = ?, precio = ?, lugar = ? WHERE id = ?').run(
    articulo,
    precio,
    lugar,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM variable_expenses WHERE id = ?').get(req.params.id));
});

app.delete('/api/variable/:id', (req, res) => {
  db.prepare('DELETE FROM variable_expenses WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Fixed payments (pagos fijos) ---

app.post('/api/months/:id/fixed', (req, res) => {
  const { articulo = '', precio = 0, paid = 0 } = req.body;
  const monthId = req.params.id;
  const pos = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM fixed_payments WHERE month_id = ?')
    .get(monthId).p;
  const info = db
    .prepare('INSERT INTO fixed_payments (month_id, articulo, precio, paid, position) VALUES (?, ?, ?, ?, ?)')
    .run(monthId, articulo, precio, paid ? 1 : 0, pos);
  res.status(201).json(db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(info.lastInsertRowid));
});

app.patch('/api/fixed/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No encontrado' });
  const { articulo = row.articulo, precio = row.precio, paid = row.paid } = req.body;
  db.prepare('UPDATE fixed_payments SET articulo = ?, precio = ?, paid = ? WHERE id = ?').run(
    articulo,
    precio,
    paid ? 1 : 0,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM fixed_payments WHERE id = ?').get(req.params.id));
});

app.delete('/api/fixed/:id', (req, res) => {
  db.prepare('DELETE FROM fixed_payments WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
