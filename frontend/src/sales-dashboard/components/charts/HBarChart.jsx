import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, COLORS } from '../../utils/formatters';

export default function HBarChart({ data = [], title, limit = 10, color = '#4f46e5' }) {
  const chartData = data.slice(0, limit).map(d => ({
    name:  (d.name || 'Unknown').length > 22 ? (d.name || '').slice(0, 22) + '…' : (d.name || 'Unknown'),
    Sales: Math.abs(d.sales || 0),
    TGM:   Math.abs(d.tgm || 0),
  })).reverse();

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)', border: '1px solid #ede9fe' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 12 }}>{title}</div>
      <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36 + 40, 200)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Bar dataKey="Sales" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
