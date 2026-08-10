import React from 'react';

export default function Chrono3DFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        background: 'radial-gradient(circle at 60% 40%, rgba(200, 168, 120, 0.04), #050505 70%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem',
        boxSizing: 'border-box'
      }}
      aria-hidden="true"
    >
      {/* Background Orbital Rings */}
      <div
        style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          border: '1px dashed rgba(200, 168, 120, 0.25)',
          animation: 'spin 60s linear infinite'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: '1px solid rgba(200, 168, 120, 0.35)',
          boxShadow: '0 0 40px rgba(200, 168, 120, 0.08)'
        }}
      />

      {/* Central Floating Symbol */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #C8A878, #8F7448 60%, #0A0A0A)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), inset 0 2px 6px rgba(255, 255, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          position: 'relative',
          zIndex: 2,
          marginBottom: '2rem'
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#050505',
            letterSpacing: '0.05em'
          }}
        >
          CHRONO
        </span>
      </div>

      {/* Progressive Architectural Timetable Blocks */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', zIndex: 2 }}>
        {[40, 65, 90, 75, 110, 50].map((h, i) => (
          <div
            key={i}
            style={{
              width: '36px',
              height: `${h}px`,
              background: 'linear-gradient(180deg, #1C1C1C 0%, #101010 100%)',
              border: '1px solid #2A2A2A',
              borderTop: '2px solid #8F7448',
              borderRadius: '4px 4px 0 0',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
