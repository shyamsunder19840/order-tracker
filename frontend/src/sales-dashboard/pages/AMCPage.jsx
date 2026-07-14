import React from 'react';
import TechPage from './TechPage';
import { fetchAMC ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { salesAPI } from '../services/api';

export default function AMCPage() {
  return (
    <TechPage
      title="AMC Sales"
      color="#10b981"
      fetchAction={fetchAMC}
      selectData={s => s.sales.amc}
      storeKey="amc"
      apiCall={salesAPI.getAMC}
    />
  );
}
