import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export default function FetchingDialog() {
  const loading = useSelector(s => s.sales.loading);
  const isFetching = Object.values(loading).some(Boolean);

  const [visible, setVisible]   = useState(false);
  const [pct, setPct]           = useState(0);
  const timerRef  = useRef(null);
  const trackedRef = useRef(new Set()); // keys that started in this fetch cycle

  useEffect(() => {
    const activeKeys = Object.entries(loading).filter(([, v]) => v).map(([k]) => k);

    if (activeKeys.length > 0) {
      // New keys becoming active — add them to this cycle's tracking set
      activeKeys.forEach(k => trackedRef.current.add(k));
      clearTimeout(timerRef.current);
      setVisible(true);
    }

    const total = trackedRef.current.size;
    if (total > 0) {
      const done   = [...trackedRef.current].filter(k => !loading[k]).length;
      const newPct = Math.round((done / total) * 100);
      setPct(newPct);

      if (!isFetching) {
        // All thunks settled — linger briefly then hide
        timerRef.current = setTimeout(() => {
          setVisible(false);
          trackedRef.current = new Set();
          setPct(0);
        }, 700);
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [loading, isFetching]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes fdSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fdSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        position:      'fixed',
        bottom:        28,
        left:          '50%',
        transform:     'translateX(-50%)',
        zIndex:        9999,
        minWidth:      220,
        borderRadius:  50,
        background:    'rgba(22, 20, 60, 0.93)',
        backdropFilter:'blur(10px)',
        boxShadow:     '0 6px 24px rgba(0,0,0,0.4)',
        overflow:      'hidden',
        animation:     'fdSlideUp 0.22s ease',
        pointerEvents: 'none',
      }}>

        {/* Main content row */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '10px 18px 8px',
        }}>
          {/* Spinner */}
          <span style={{
            display:      'inline-block',
            width:        15,
            height:       15,
            border:       '2px solid rgba(255,255,255,0.25)',
            borderTop:    '2px solid #a5b4fc',
            borderRadius: '50%',
            animation:    'fdSpin 0.7s linear infinite',
            flexShrink:   0,
          }} />

          {/* Text */}
          <span style={{
            color:       '#e0e7ff',
            fontSize:    13,
            fontWeight:  500,
            letterSpacing: '0.02em',
            whiteSpace:  'nowrap',
          }}>
            Fetching details…
          </span>

          {/* Percentage badge */}
          <span style={{
            marginLeft:   4,
            background:   pct === 100 ? 'rgba(52,211,153,0.25)' : 'rgba(165,180,252,0.2)',
            color:        pct === 100 ? '#6ee7b7' : '#a5b4fc',
            fontSize:     12,
            fontWeight:   700,
            padding:      '2px 9px',
            borderRadius: 20,
            minWidth:     42,
            textAlign:    'center',
            transition:   'all 0.3s',
          }}>
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height:     3,
          background: 'rgba(255,255,255,0.1)',
        }}>
          <div style={{
            height:     '100%',
            width:      `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #34d399, #6ee7b7)'
              : 'linear-gradient(90deg, #6366f1, #a5b4fc)',
            borderRadius: '0 2px 2px 0',
            transition:  'width 0.35s ease, background 0.3s',
          }} />
        </div>

      </div>
    </>
  );
}
