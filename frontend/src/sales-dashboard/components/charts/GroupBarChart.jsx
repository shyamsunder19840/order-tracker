import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export default function GroupBarChart({ data = [], title, nameKey = 'name' }) {
  const chartData = data.slice(0, 12).map(d => ({
    name:  d[nameKey] || 'Unknown',
    Sales: Math.abs(d.sales || 0),
    TGM:   Math.abs(d.tgm || 0),
    ETGM:  Math.abs(d.etgm || 0),
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)', border: '1px solid #ede9fe' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 12 }}>{title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="TGM"   fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ETGM"  fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
