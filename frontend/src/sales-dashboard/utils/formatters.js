export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  const num = Number(value);
  if (Math.abs(num) >= 10_000_000)
    return `₹${(num / 10_000_000).toFixed(decimals)} Cr`;
  if (Math.abs(num) >= 100_000)
    return `₹${(num / 100_000).toFixed(decimals)} L`;
  if (Math.abs(num) >= 1_000)
    return `₹${(num / 1_000).toFixed(decimals)} K`;
  return `₹${num.toFixed(decimals)}`;
};

export const formatNumber = (value) => {
  if (!value && value !== 0) return '—';
  return Number(value).toLocaleString('en-IN');
};

export const formatPct = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${Number(value).toFixed(2)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#6366f1', '#84cc16', '#0ea5e9',
];

export const GRADIENT_COLORS = {
  blue:   ['#4f46e5', '#818cf8'],
  teal:   ['#0d9488', '#2dd4bf'],
  green:  ['#059669', '#34d399'],
  amber:  ['#d97706', '#fcd34d'],
  red:    ['#dc2626', '#f87171'],
  purple: ['#7c3aed', '#c4b5fd'],
};
