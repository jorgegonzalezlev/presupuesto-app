'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL').format(Math.round(n || 0));
}

function shiftMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function EditableText({ value, onCommit, placeholder }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="cell cell-text"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

function EditableNumber({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value ?? 0));
  useEffect(() => setDraft(String(value ?? 0)), [value]);
  return (
    <input
      className="cell cell-number"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
      onBlur={() => {
        const n = Number(draft || 0);
        if (n !== value) onCommit(n);
        else setDraft(String(value ?? 0));
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

function VariableTable({ rows, onUpdate, onAdd, onDelete }) {
  const total = rows.reduce((s, r) => s + r.precio, 0);
  return (
    <div className="panel">
      <table className="grid-table">
        <thead>
          <tr>
            <th>artículo</th>
            <th>precio</th>
            <th>lugar</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <EditableText value={r.articulo} onCommit={(v) => onUpdate(r.id, { articulo: v })} />
              </td>
              <td>
                <EditableNumber value={r.precio} onCommit={(v) => onUpdate(r.id, { precio: v })} />
              </td>
              <td>
                <EditableText value={r.lugar} onCommit={(v) => onUpdate(r.id, { lugar: v })} />
              </td>
              <td>
                <button className="row-remove" onClick={() => onDelete(r.id)} title="Eliminar fila">
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td>total variable</td>
            <td className="num">{formatCLP(total)}</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <button className="add-row" onClick={onAdd}>
        + agregar artículo
      </button>
    </div>
  );
}

function FixedTable({ rows, onUpdate, onAdd, onDelete }) {
  const total = rows.reduce((s, r) => s + r.precio, 0);
  return (
    <div className="panel">
      <table className="grid-table">
        <thead>
          <tr>
            <th>pagos fijos</th>
            <th>precio</th>
            <th>pagado</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.paid ? 'paid' : ''}>
              <td>
                <EditableText value={r.articulo} onCommit={(v) => onUpdate(r.id, { articulo: v })} />
              </td>
              <td>
                <EditableNumber value={r.precio} onCommit={(v) => onUpdate(r.id, { precio: v })} />
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={!!r.paid}
                  onChange={(e) => onUpdate(r.id, { paid: e.target.checked ? 1 : 0 })}
                />
              </td>
              <td>
                <button className="row-remove" onClick={() => onDelete(r.id)} title="Eliminar fila">
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td>total fijos</td>
            <td className="num">{formatCLP(total)}</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <button className="add-row" onClick={onAdd}>
        + agregar pago fijo
      </button>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`summary-card tone-${tone}`}>
      <span className="summary-label">{label}</span>
      <span className="summary-value">{formatCLP(value)}</span>
    </div>
  );
}

export default function Home() {
  const [months, setMonths] = useState([]);
  const [monthId, setMonthId] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(true);

  const reload = useCallback(async (id) => {
    const full = await api.getMonth(id);
    setData(full);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listMonths();
        if (list.length === 0) {
          const now = new Date();
          const created = await api.createMonth(now.getFullYear(), now.getMonth() + 1, 0);
          setMonths([{ id: created.id, year: created.year, month: created.month, sueldo: created.sueldo }]);
          setMonthId(created.id);
        } else {
          setMonths(list);
          setMonthId(list[list.length - 1].id);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (monthId != null) reload(monthId).catch((e) => setError(e.message));
  }, [monthId, reload]);

  async function goToMonth(delta) {
    if (!data) return;
    const target = shiftMonth(data.year, data.month, delta);
    const existing = months.find((m) => m.year === target.year && m.month === target.month);
    if (existing) {
      setMonthId(existing.id);
      return;
    }
    try {
      const created = await api.createMonth(target.year, target.month, data.sueldo);
      if (delta > 0) {
        for (const fp of data.fixedPayments) {
          await api.addFixed(created.id, { articulo: fp.articulo, precio: fp.precio, paid: 0 });
        }
      }
      const list = await api.listMonths();
      setMonths(list);
      setMonthId(created.id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSueldo(v) {
    if (!data) return;
    const updated = await api.updateSueldo(data.id, v);
    setData(updated);
    setMonths((prev) => prev.map((m) => (m.id === updated.id ? { ...m, sueldo: updated.sueldo } : m)));
  }

  async function handleVarUpdate(id, patch) {
    await api.updateVariable(id, patch);
    reload(monthId);
  }
  async function handleVarAdd() {
    await api.addVariable(monthId, { articulo: '', precio: 0, lugar: '' });
    reload(monthId);
  }
  async function handleVarDelete(id) {
    await api.deleteVariable(id);
    reload(monthId);
  }

  async function handleFixedUpdate(id, patch) {
    await api.updateFixed(id, patch);
    reload(monthId);
  }
  async function handleFixedAdd() {
    await api.addFixed(monthId, { articulo: '', precio: 0, paid: 0 });
    reload(monthId);
  }
  async function handleFixedDelete(id) {
    await api.deleteFixed(id);
    reload(monthId);
  }

  if (busy) return <div className="app-shell">Cargando…</div>;
  if (error) return <div className="app-shell error">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Presupuesto mensual</h1>
        <div className="month-nav">
          <button onClick={() => goToMonth(-1)}>◀</button>
          <span className="month-label">
            {MESES[data.month - 1]} {data.year}
          </span>
          <button onClick={() => goToMonth(1)}>▶</button>
        </div>
      </header>

      <section className="summary-row">
        <SummaryCard label="actual" value={data.totals.actual} tone="green" />
        <div className="summary-card tone-blue editable">
          <span className="summary-label">sueldo</span>
          <EditableNumber value={data.sueldo} onCommit={handleSueldo} />
        </div>
        <SummaryCard label="total fijos" value={data.totals.totalFijos} tone="orange" />
        <SummaryCard label="total gastos" value={data.totals.totalGastos} tone="red" />
      </section>

      <section className="tables-row">
        <VariableTable
          rows={data.variableExpenses}
          onUpdate={handleVarUpdate}
          onAdd={handleVarAdd}
          onDelete={handleVarDelete}
        />
        <FixedTable
          rows={data.fixedPayments}
          onUpdate={handleFixedUpdate}
          onAdd={handleFixedAdd}
          onDelete={handleFixedDelete}
        />
      </section>
    </div>
  );
}
