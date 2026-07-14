import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const tip = { formatter: (v) => formatCurrency(v) };

export default function SalesTrendChart({ data = [], title = 'Monthly Sales Trend' }) {
  const chartData = data.map(d => ({
    name:  d.name,
    Sales: d.sales,
    TGM:   d.tgm,
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)', border: '1px solid #ede9fe' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 16 }}>{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={tip.formatter} />
          <Legend />
          <Bar dataKey="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="TGM"   fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
