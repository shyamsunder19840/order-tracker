import React from 'react';
import TechPage from './TechPage';
import { fetchSAAS ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { salesAPI } from '../services/api';

export default function SAASPage() {
  return (
    <TechPage
      title="SaaS Sales"
      color="#f59e0b"
      fetchAction={fetchSAAS}
      selectData={s => s.sales.saas}
      storeKey="saas"
      apiCall={salesAPI.getSAAS}
    />
  );
}
