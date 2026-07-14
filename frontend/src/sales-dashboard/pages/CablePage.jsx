import React from 'react';
import TechPage from './TechPage';
import { fetchCable ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { salesAPI } from '../services/api';

export default function CablePage() {
  return (
    <TechPage
      title="Cabling Sales"
      color="#f97316"
      fetchAction={fetchCable}
      selectData={s => s.sales.cable}
      storeKey="cable"
      apiCall={salesAPI.getCable}
    />
  );
}
