import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';

// Chapter II release: July 31st 18:00 GMT+6 == 12:00 UTC
const RELEASE_TIME = Date.UTC(2026, 6, 31, 12, 0, 0);

const READING_RULES: { title: string; body: string }[] = [
  { title: 'Section, intermezzo, chapter, intermezzo, chapter...', body: 'Every section opens and closes with an intermezzo. Chapters always have intermezzoes between them.' },
  { title: 'Sections', body: 'Every section has an odd number of chapters and even number of intermezzoes. The central subject of intermezzoes alter in every section.' },
  { title: 'Intermezzoes', body: 'All intermezzoes reference past events. Intermezzoes target <500 words. Intermezzoes connect chapters, with exception to the first and the last intermezzo of a section. The first intermezzo foreshadows the premise of the section. The final intermezzo reveals an event that happened sometime after the final chapter in that section.' },
  { title: 'Chapters', body: 'Every chapter must start and finish with the same character. Every chapter must feature the starting character for longer than any other character. Every chapter targets around 8\'000-10\'000 words.' },
  { title: 'Once published, never overwritten', body: 'Once the story of a chapter or an intermezzo has been published, it cannot be changed. The last published chapter and intermezzo can receive one half-time revision, but that revision cannot change core events.' },
];

export default function Fiction() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const isMobile = useIsMobile();

  // Sync the clock to a trusted network time source so the release can't be
  // unlocked early (or hidden) by changing the device clock. We keep the offset
  // between server time and the local clock and apply it to every tick.
  const offsetRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  const [syncDone, setSyncDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const sources: { url: string; pick: (d: any) => number }[] = [
      { url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', pick: (d) => d.unixtime * 1000 },
      { url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC', pick: (d) => Date.parse(d.dateTime + 'Z') },
    ];
    (async () => {
      for (const s of sources) {
        try {
          const res = await fetch(s.url, { cache: 'no-store' });
          if (!res.ok) continue;
          const serverMs = s.pick(await res.json());
          if (!Number.isFinite(serverMs)) continue;
          if (!cancelled) {
            offsetRef.current = serverMs - Date.now();
            setNow(Date.now() + offsetRef.current);
          }
          break;
        } catch {
          /* fall through to the next source */
        }
      }
      if (!cancelled) setSyncDone(true);
    })();
    const id = setInterval(() => setNow(Date.now() + offsetRef.current), 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const remaining = Math.max(0, RELEASE_TIME - now);
  // Only trust a "released" state once we've reconciled with server time, so a
  // fast-forwarded local clock can't flash the released view before sync lands.
  const isReleased = remaining === 0 && syncDone;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const currentPdf = isReleased ? "/Thezeraine2.pdf" : "/Thezeraine.pdf";

  const fullSummary = "A bereft young woman agrees to venture into an emerging civil war for the promise of a resurrection device.";

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#000000',
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'flex-end',
      justifyContent: isMobile ? 'space-between' : undefined,
      padding: isMobile ? '1.5rem' : '3rem',
      gap: isMobile ? '1.5rem' : 0,
      overflow: 'hidden'
    }}>
      {!isMobile && (
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
      )}
      {isMobile ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          margin: 'auto 0'
        }}>
          <img
            src="/design/Chapter II preview.png"
            alt="Chapter II preview"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          {isReleased ? (
            <SpotifyLink isMobile={isMobile} />
          ) : (
            <Countdown hours={hours} minutes={minutes} seconds={seconds} isMobile={isMobile} />
          )}
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '12rem',
          transform: 'translateY(-50%)',
          maxWidth: '55%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          zIndex: 2
        }}>
          <img
            src="/design/Chapter II preview.png"
            alt="Chapter II preview"
            style={{
              maxHeight: isReleased ? '85vh' : '60vh',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none'
            }}
          />
          {isReleased ? (
            <SpotifyLink isMobile={isMobile} />
          ) : (
            <Countdown hours={hours} minutes={minutes} seconds={seconds} isMobile={isMobile} />
          )}
        </div>
      )}
      <div style={{ maxWidth: isMobile ? '100%' : '600px', position: 'relative', zIndex: 2 }}>
        <h1 style={{
          fontFamily: 'Thezeraine, serif',
          fontSize: isMobile ? '2.5rem' : '4rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          lineHeight: '1.2'
        }}>
          Thezeraine.
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
            <span>~1h 28m</span>
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <a
            href={currentPdf}
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

          <a
            href={currentPdf}
            download
            aria-label="Download the current version"
            title="Download the current version"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.25rem',
              height: '3.25rem',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              color: '#ffffff',
              opacity: 1,
              border: '1px solid #ffffff',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>

          <button
            onClick={() => setShowGuide(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              border: '1px solid #ffffff',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Guide
          </button>
        </div>
      </div>

      {showGuide && (
        <ReadingGuideModal onClose={() => setShowGuide(false)} isMobile={isMobile} />
      )}
    </div>
  );
}

function SpotifyLink({ isMobile }: { isMobile: boolean }) {
  return (
    <iframe
      src="https://open.spotify.com/embed/track/0az7v5wI8xjgfzXBfWRhVd?utm_source=generator"
      width={isMobile ? '100%' : '400'}
      height="152"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify player"
      style={{ border: 0, borderRadius: '12px', display: 'block', width: isMobile ? '100%' : '400px', maxWidth: '100%' }}
    />
  );
}

function Countdown({ hours, minutes, seconds, isMobile }: { hours: number; minutes: number; seconds: number; isMobile: boolean }) {
  useEffect(() => {
    if (document.getElementById('thz-rolldown-kf')) return;
    const el = document.createElement('style');
    el.id = 'thz-rolldown-kf';
    el.textContent = '@keyframes thz-rolldown{from{transform:translateY(-50%)}to{transform:translateY(0)}}';
    document.head.appendChild(el);
  }, []);

  const cellHeight = isMobile ? 56 : 82;
  const cellStyle: CSSProperties = {
    fontSize: isMobile ? '2.75rem' : '4rem',
    fontWeight: 600,
    color: '#ffffff',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    minWidth: isMobile ? '3rem' : '4.4rem',
  };
  const pad = (n: number) => n.toString().padStart(2, '0');
  const units = [
    { value: pad(hours), label: 'hrs' },
    { value: pad(minutes), label: 'min' },
    { value: pad(seconds), label: 'sec' },
  ];

  const colon = (
    <div style={{ ...cellStyle, minWidth: 'auto', height: cellHeight, display: 'flex', alignItems: 'center' }}>:</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '0.9rem' : '1.1rem' }}>
      <span style={{
        color: '#d3d3d3',
        fontSize: isMobile ? '0.95rem' : '1.1rem',
        letterSpacing: '0.06em',
      }}>
        Chapter II releases in...
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '0.4rem' : '0.6rem' }}>
        {units.map((u, i) => (
          <div key={u.label} style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '0.4rem' : '0.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <RollDown value={u.value} cellHeight={cellHeight} cellStyle={cellStyle} />
              <span style={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && colon}
          </div>
        ))}
      </div>
    </div>
  );
}

// A vertically-clipped cell whose value slides down into place when it changes.
// Stateless w.r.t. the animation: `value` is always rendered directly and the
// slide is a fire-and-forget CSS animation keyed on `value`, so nothing can wedge.
function RollDown({ value, cellHeight, cellStyle }: { value: string; cellHeight: number; cellStyle: CSSProperties }) {
  const prevRef = useRef(value);
  const prev = prevRef.current;
  useEffect(() => { prevRef.current = value; });

  const cell = (v: string) => (
    <div style={{ ...cellStyle, height: cellHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {v}
    </div>
  );

  // Track holds [new (top), old (bottom)]; the keyframe slides it down from
  // showing `prev` to showing `value`. Remounting via key restarts the slide.
  return (
    <div style={{ height: cellHeight, overflow: 'hidden' }}>
      <div
        key={value}
        style={{ animation: prev !== value ? 'thz-rolldown 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none' }}
      >
        {cell(value)}
        {cell(prev)}
      </div>
    </div>
  );
}

function ReadingGuideModal({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: isMobile ? '0.75rem' : '1rem',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.9rem',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.6rem',
            lineHeight: 1,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; }}
        >
          {'×'}
        </button>

        <div style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
          <h2 style={{
            fontFamily: 'Thezeraine, serif',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            color: '#ffffff',
            margin: '0 0 0.4rem',
          }}>
            Thezeraine.
          </h2>
          <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            The word "Thezeraine" is allegedly derived from "Heaven". Thezeraine is a rolling-release novel, which abides by the following rules, which were handcrafted to encourage thoughtful writing, engagement, and anticipation:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {READING_RULES.map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.9rem' }}>
                <span style={{
                  color: '#666',
                  fontSize: '1.2rem',
                  minWidth: '1.5rem',
                }}>
                  {i + 1}
                </span>
                <div>
                  <h3 style={{ color: '#eee', fontSize: '1rem', margin: '0 0 0.3rem' }}>
                    {rule.title}
                  </h3>
                  <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                    {rule.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
