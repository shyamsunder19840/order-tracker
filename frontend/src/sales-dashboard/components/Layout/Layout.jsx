import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import FetchingDialog from '../FetchingDialog';

export default function Layout({ title, children }) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'linear-gradient(160deg, #f0f4ff 0%, #f5f3ff 50%, #faf5ff 100%)' }}>
          {children}
        </main>
      </div>
      <FetchingDialog />
    </div>
  );
}
