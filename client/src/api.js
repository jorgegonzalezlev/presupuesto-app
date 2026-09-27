const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listMonths: () => request('/months'),
  createMonth: (year, month, sueldo = 0) =>
    request('/months', { method: 'POST', body: JSON.stringify({ year, month, sueldo }) }),
  getMonth: (id) => request(`/months/${id}`),
  updateSueldo: (id, sueldo) =>
    request(`/months/${id}`, { method: 'PATCH', body: JSON.stringify({ sueldo }) }),
  deleteMonth: (id) => request(`/months/${id}`, { method: 'DELETE' }),

  addVariable: (monthId, data) =>
    request(`/months/${monthId}/variable`, { method: 'POST', body: JSON.stringify(data) }),
  updateVariable: (id, data) =>
    request(`/variable/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVariable: (id) => request(`/variable/${id}`, { method: 'DELETE' }),

  addFixed: (monthId, data) =>
    request(`/months/${monthId}/fixed`, { method: 'POST', body: JSON.stringify(data) }),
  updateFixed: (id, data) =>
    request(`/fixed/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFixed: (id) => request(`/fixed/${id}`, { method: 'DELETE' }),
};
