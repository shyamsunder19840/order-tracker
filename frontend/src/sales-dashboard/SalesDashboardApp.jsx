import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchFiltersMeta } from './store/slices/salesSlice';

import Dashboard      from './pages/Dashboard';
import SRMData        from './pages/SRMData';
import CiscoPage      from './pages/CiscoPage';
import NonCiscoPage   from './pages/NonCiscoPage';
import AMCPage        from './pages/AMCPage';
import SAASPage       from './pages/SAASPage';
import CablePage      from './pages/CablePage';
import RegionPage     from './pages/RegionPage';
import SegmentPage    from './pages/SegmentPage';
import SalesTeamPage  from './pages/SalesTeamPage';
import MasterDataPage from './pages/MasterDataPage';
import BandWisePage   from './pages/BandWisePage';
import SalesSummaryPage from './pages/SalesSummaryPage';
import TechSummaryPage  from './pages/TechSummaryPage';
import BigDealsPage   from './pages/BigDealsPage';
import FYPage         from './pages/FYPage';

// Large Deals page reuses BigDealsPage pattern with different thunk
import LargeDealsPage from './pages/LargeDealsPage';

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(fetchFiltersMeta()); }, [dispatch]);

  return (
    <Routes>
      <Route path="/"              element={<Dashboard />}       />
      <Route path="/srm-data"      element={<SRMData />}         />

      {/* Summary sheets */}
      <Route path="/sales-summary" element={<SalesSummaryPage />} />
      <Route path="/tech-summary"  element={<TechSummaryPage />}  />
      <Route path="/band-wise"     element={<BandWisePage />}     />
      <Route path="/fy-view"       element={<FYPage />}           />

      {/* Technology */}
      <Route path="/cisco"         element={<CiscoPage />}       />
      <Route path="/non-cisco"     element={<NonCiscoPage />}    />
      <Route path="/amc"           element={<AMCPage />}         />
      <Route path="/saas"          element={<SAASPage />}        />
      <Route path="/cable"         element={<CablePage />}       />

      {/* Dimensions */}
      <Route path="/region"        element={<RegionPage />}      />
      <Route path="/segment"       element={<SegmentPage />}     />
      <Route path="/sales-team"    element={<SalesTeamPage />}   />

      {/* Deal analysis */}
      <Route path="/big-deals"     element={<BigDealsPage />}    />
      <Route path="/large-deals"   element={<LargeDealsPage />}  />

      {/* Reference */}
      <Route path="/master-data"   element={<MasterDataPage />}  />
    </Routes>
  );
}
