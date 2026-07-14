import React from 'react';
import TechPage from './TechPage';
import { fetchNonCisco ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { salesAPI } from '../services/api';

export default function NonCiscoPage() {
  return (
    <TechPage
      title="NON-CISCO Sales"
      color="#8b5cf6"
      fetchAction={fetchNonCisco}
      selectData={s => s.sales.nonCisco}
      storeKey="nonCisco"
      apiCall={salesAPI.getNonCisco}
    />
  );
}
