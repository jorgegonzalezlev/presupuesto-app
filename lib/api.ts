async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

interface Month {
  id: number;
  year: number;
  month: number;
  sueldo: number;
}

interface MonthFull extends Month {
  variableExpenses: any[];
  fixedPayments: any[];
  totals: {
    totalFijos: number;
    totalVariable: number;
    totalGastos: number;
    actual: number;
  };
}

export const api = {
  listMonths: () => request<Month[]>('/months'),
  createMonth: (year: number, month: number, sueldo?: number) =>
    request<MonthFull>('/months', { method: 'POST', body: JSON.stringify({ year, month, sueldo }) }),
  getMonth: (id: number) => request<MonthFull>(`/months/${id}`),
  updateSueldo: (id: number, sueldo: number) =>
    request<MonthFull>(`/months/${id}`, { method: 'PATCH', body: JSON.stringify({ sueldo }) }),
  deleteMonth: (id: number) =>
    request<null>(`/months/${id}`, { method: 'DELETE' }),

  addVariable: (monthId: number, data: any) =>
    request<any>(`/months/${monthId}/variable`, { method: 'POST', body: JSON.stringify(data) }),
  updateVariable: (id: number, data: any) =>
    request<any>(`/variable/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVariable: (id: number) =>
    request<null>(`/variable/${id}`, { method: 'DELETE' }),

  addFixed: (monthId: number, data: any) =>
    request<any>(`/months/${monthId}/fixed`, { method: 'POST', body: JSON.stringify(data) }),
  updateFixed: (id: number, data: any) =>
    request<any>(`/fixed/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFixed: (id: number) =>
    request<null>(`/fixed/${id}`, { method: 'DELETE' }),
};
