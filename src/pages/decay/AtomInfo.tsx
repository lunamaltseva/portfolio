import type { Isotope } from './nuclearData';

interface AtomInfoProps {
  isotope: Isotope | null;
  isExcited: boolean;
  isMobile: boolean;
}

export default function AtomInfo({ isotope, isExcited, isMobile }: AtomInfoProps) {
  if (!isotope) {
    return (
      <div
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 24,
          left: isMobile ? 12 : 24,
          zIndex: 10,
          backgroundColor: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid #333',
          borderRadius: '0.75rem',
          padding: isMobile ? '12px 16px' : '16px 24px',
          color: '#888',
          fontFamily: 'var(--font-primary), sans-serif',
          fontSize: isMobile ? '14px' : '16px',
        }}
      >
        Select an atom to begin
      </div>
    );
  }

  const massNumber = isotope.protons + isotope.neutrons;

  return (
    <div
      style={{
        position: 'absolute',
        top: isMobile ? 12 : 24,
        left: isMobile ? 12 : 24,
        zIndex: 10,
        backgroundColor: 'rgba(20, 20, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #333',
        borderRadius: '0.75rem',
        padding: isMobile ? '12px 16px' : '20px 28px',
        color: '#ffffff',
        fontFamily: 'var(--font-primary), sans-serif',
        minWidth: isMobile ? '140px' : '180px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-title), sans-serif',
          fontSize: isMobile ? '22px' : '28px',
          marginBottom: '8px',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isotope.name}
        {isExcited && (
          <span
            style={{
              fontSize: '12px',
              color: '#f39c12',
              fontFamily: 'var(--font-primary), sans-serif',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            (excited)
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: isMobile ? '13px' : '15px',
          color: '#ccc',
          lineHeight: '1.6',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>
            <span style={{ color: '#888' }}>Z</span>{' '}
            <span style={{ color: '#e74c3c' }}>{isotope.protons}</span>
          </span>
          <span>
            <span style={{ color: '#888' }}>N</span>{' '}
            <span style={{ color: '#7f8c8d' }}>{isotope.neutrons}</span>
          </span>
          <span>
            <span style={{ color: '#888' }}>A</span>{' '}
            <span style={{ color: '#fff' }}>{massNumber}</span>
          </span>
        </div>
      </div>

      {isotope.isStable && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#2ecc71',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
          }}
        >
          STABLE
        </div>
      )}
    </div>
  );
}
