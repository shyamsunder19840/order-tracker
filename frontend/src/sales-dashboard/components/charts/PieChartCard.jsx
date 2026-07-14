import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, COLORS } from '../../utils/formatters';

export default function PieChartCard({ data = [], title, nameKey = 'name', valueKey = 'sales' }) {
  const chartData = data.slice(0, 8).map(d => ({
    name:  d[nameKey] || 'Unknown',
    value: Math.abs(d[valueKey] || 0),
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)', border: '1px solid #ede9fe' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 12 }}>{title}</div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData} dataKey="value" nameKey="name"
            cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
