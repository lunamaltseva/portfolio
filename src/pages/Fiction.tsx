import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Fiction() {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const fullSummary = "A bereft young woman agrees to venture into an emerging civil war for the promise of a resurrection device.";

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#000000',
      minHeight: 'calc(100vh - 150px)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: isMobile ? '1.5rem' : '3rem',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '50%',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
      <div style={{ maxWidth: isMobile ? '100%' : '600px', position: 'relative', zIndex: 2 }}>
        <h1 style={{
          fontFamily: 'Thezeraine, serif',
          fontSize: isMobile ? '2.5rem' : '4rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          lineHeight: '1.2'
        }}>
          Thezeraine
        </h1>

        <div style={{
          display: 'flex',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#d3d3d3',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d3d3d3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>2025-20XX</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#d3d3d3',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d3d3d3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>~44m</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <span style={{
            backgroundColor: '#888888',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem'
          }}>
            Sci-fi
          </span>
          <span style={{
            backgroundColor: '#888888',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            borderRadius: '0.375rem'
          }}>
            Drama
          </span>
        </div>

        <p
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            color: '#ffffff',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
            maxWidth: '600px',
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {fullSummary}
        </p>

        <a
          href="/Thezeraine.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            textDecoration: 'none',
            border: 'none',
            borderRadius: '0.375rem',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Read
        </a>
      </div>
    </div>
  );
}
