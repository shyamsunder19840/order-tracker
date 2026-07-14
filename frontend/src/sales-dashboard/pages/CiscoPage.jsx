import React from 'react';
import TechPage from './TechPage';
import { fetchCisco ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { salesAPI } from '../services/api';

export default function CiscoPage() {
  return (
    <TechPage
      title="CISCO Sales"
      color="#0ea5e9"
      fetchAction={fetchCisco}
      selectData={s => s.sales.cisco}
      storeKey="cisco"
      apiCall={salesAPI.getCisco}
    />
  );
}
