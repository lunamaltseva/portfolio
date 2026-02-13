import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface DesignItem {
  title: string;
  date: string;
  description: string;
  type: 'image' | 'pdf' | 'mp4';
  url: string;
  thumbnailUrl?: string;
  aspect?: number; // width / height, e.g. 0.73 for portrait, 1.5 for landscape
}

interface DesignSection {
  title: string;
  description: string;
  date: string;
  items: DesignItem[];
}

const STRIP_HEIGHT = 200;

const sections: DesignSection[] = [
  {
    title: 'Commissioned',
    description: 'Promotional materials, presentations, and branding created for AUCA departments.',
    date: 'Fall 2024 — Present',
    items: [
      {
        title: 'WARC Handbook',
        date: 'May 2024',
        description: 'A handbook I put together for funzies for the Writing and Academic Resource Center, though I never finished it.',
        type: 'pdf',
        url: '/design/WARC Handbook.pdf',
        aspect: 960 / 540,
      },
      {
        title: 'WARC Animated Logotype',
        date: 'October 2023',
        description: 'An animated version of the WARC logotype. Created shortly after the logotype itself.',
        type: 'mp4',
        url: '/design/Animation Light.mp4',
        aspect: 1920 / 1080,
      },
      {
        title: "Career Fair Form Header",
        date: 'March 2025',
        description: 'Banner header for the AUCA Career Center career fair registration form.',
        type: 'image',
        url: '/design/Career Fair Header.png',
        aspect: 1600 / 400,
      },
      {
        title: "Proposed Logotype for Academic Advising",
        date: 'May 2025',
        description: 'Logo proposal for Academic Advising. Turned down due to not being AUCA-ey.',
        type: 'image',
        url: '/design/Academic Advising Logo.png',
        aspect: 2582 / 1024,
      },
      {
        title: 'AUCA Campus Coloring Page',
        date: 'May 2024',
        description: 'Created as an insult to the then-staff of the Academic Advising office. To my surprise, it was readily accepted.',
        type: 'pdf',
        url: '/design/AUCA Campus Coloring Page.pdf',
        aspect: 595.32 / 841.92,
      },
      {
        title: 'Registration Schedule',
        date: 'September 2023',
        description: 'Originally designed for myself, soon polished and distributed university-wide. Became officially endorsed two months after.',
        type: 'pdf',
        url: '/design/Schedule.pdf',
        aspect: 595.32 / 841.92,
      },
      {
        title: 'University Timetable',
        date: '2024',
        description: 'Landscape-format daily timetable showing the times services at AUCA are open.',
        type: 'pdf',
        url: '/design/Timetable.pdf',
        aspect: 841.89 / 595.276,
      },
      {
        title: 'Calendar',
        date: 'July 2024',
        description: 'Originally designed for myself, soon polished and distributed university-wide. Now, it is promoted to everyone at the start of the academic year.',
        type: 'image',
        url: '/design/Calendar.png',
        aspect: 2054 / 2054,
      },
      {
        title: 'COM-122 Game Jam',
        date: 'November 2025',
        description: 'Promotional title card for the Introduction to Programming course\'s "Breakout" pilot Game Jam.',
        type: 'image',
        url: '/design/COM122 Gamejam.png',
        aspect: 652 / 367,
      },
      {
        title: 'Level Editor Splash Screen',
        date: 'March 2025',
        description: 'Pixel art splash screen for a platformer level editor. Designed for the Object-Oriented Programming course.',
        type: 'image',
        url: '/design/Level Editor Splash Screen.png',
        aspect: 600 / 400,
      },
    ],
  },
  {
    title: 'Authored',
    description: 'Design work created for personal use or enjoyment.',
    date: '2023 — Present',
    items: [
      {
        title: 'Experte Concept',
        date: 'November 2025',
        description: 'Thezeraine. A refurbished version of the dual-blade tower, conceptualized first in 2018. The mascot of Theoderau. Seen here, towering over a kilometer high: the upper section actively supported by tetranol-powered Aegis shields. On the upper floors of the right tower, a stack of cooling fins.',
        type: 'image',
        url: '/design/Experte.png',
        aspect: 301 / 1073,
      },
      {
        title: 'Caoz Concept',
        date: '2023',
        description: 'Thezeraine. An attempt to depict a Caoz Rifle. Looks nice, though not incredibly practical. The red glowing squares are magnets; as the rifle charges up, they float and axially rotate around the body of the rifle.',
        type: 'image',
        url: '/design/Caoz Concept.png',
        aspect: 1920 / 1080,
      },
      {
        title: 'ARTeMiS Presentation',
        date: 'November 2025',
        description: 'Slide deck for the ARTeMiS project presentation.',
        type: 'pdf',
        url: '/design/ARTeMiS.pdf',
        aspect: 960 / 540,
      },
      {
        title: 'Green Club Logotype',
        date: 'April 2024',
        description: 'Logo for the AUCA Green Club. Became official five months later. Originally designed due to me being fed up with the ugly logo.',
        type: 'image',
        url: '/design/Green Club Logotype.png',
        aspect: 1025 / 1025,
      },
      {
        title: 'Climate Week',
        date: 'March 2025',
        description: 'Promotional poster for Climate Education Week at AUCA Sustainable.',
        type: 'image',
        url: '/design/Climate Week.png',
        aspect: 1080 / 1080,
      },
      {
        title: 'Darmarka Poster',
        date: 'February 2025',
        description: 'Event poster for the AUCA Darmarka and handmade fair organized with the Center for Civic Engagement. Depicts the AUCA Forum, where the event is regularly held. It is worth mentioning that the conception of the event was partially my idea.',
        type: 'image',
        url: '/design/Darmarka Poster.png',
        aspect: 1920 / 1080,
      },
      {
        title: 'Personal Font',
        date: '2022',
        description: 'A custom pixel art font I put together for my own purposes back in 2022, having become tired of manually drawing it every time.',
        type: 'image',
        url: '/design/Personal Font.png',
        aspect: 113 / 149,
      },
      {
        title: 'Candidacy Poster',
        date: 'October 2025',
        description: 'The poster I used to run for the Student Senate in 2025. I did not get elected. I did spend thirty minutes stretching my arm and changing outfits to get the photo, which still did not turn out great, despite my efforts.',
        type: 'image',
        url: '/design/Candidacy Poster.png',
        aspect: 2126 / 3508,
      },
      {
        title: 'Business Card',
        date: 'December 2025',
        description: 'A minimalistic business card.',
        type: 'image',
        url: '/design/Business Card.png',
        aspect: 1050 / 600,
      },
    ],
  }
];

// Image area height = STRIP_HEIGHT - title bar (~40px)
const IMG_HEIGHT = STRIP_HEIGHT - 40;

function getItemWidth(item: DesignItem): number {
  const aspect = item.aspect || 1;
  const w = IMG_HEIGHT * aspect;
  return Math.max(100, Math.min(360, Math.round(w)));
}

function PdfThumbnail({ url, width }: { url: string; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const pdf = await pdfjsLib.getDocument(encodeURI(url)).promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const desiredWidth = width * 2;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvasContext: canvas.getContext('2d')!,
          viewport,
          canvas,
        } as any).promise;
      } catch {
        // PDF not found or failed to load
      }
    }
    render();
    return () => { cancelled = true; };
  }, [url, width]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${IMG_HEIGHT}px`,
        objectFit: 'cover',
        backgroundColor: '#1e1e1e',
        display: 'block',
      }}
    />
  );
}

function PdfModalViewer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const pdf = await pdfjsLib.getDocument(encodeURI(url)).promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const desiredWidth = 800;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvasContext: canvas.getContext('2d')!,
          viewport,
          canvas,
        } as any).promise;
      } catch {
        // PDF not found or failed to load
      }
    }
    render();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '0.5rem' }} />
      <a
        href={encodeURI(url)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: '0.5rem',
          color: '#888',
          fontSize: '0.85rem',
          textDecoration: 'underline',
        }}
      >
        Open full PDF
      </a>
    </div>
  );
}

function StripItem({ item, onClick, highlighted }: { item: DesignItem; onClick: () => void; highlighted?: boolean }) {
  const itemWidth = getItemWidth(item);

  return (
    <div
      onClick={onClick}
      style={{
        width: `${itemWidth}px`,
        height: `${STRIP_HEIGHT}px`,
        flexShrink: 0,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: highlighted ? '2px solid #888' : '1px solid #222',
        backgroundColor: highlighted ? '#1a1a1a' : '#141414',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: highlighted ? '0 0 16px rgba(136, 136, 136, 0.3)' : 'none',
      }}
      onMouseEnter={(e) => { if (!highlighted) e.currentTarget.style.borderColor = '#555'; }}
      onMouseLeave={(e) => { if (!highlighted) e.currentTarget.style.borderColor = '#222'; }}
    >
      {item.type === 'image' ? (
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.title}
          draggable={false}
          style={{ width: `${itemWidth}px`, height: `${IMG_HEIGHT}px`, objectFit: 'cover', display: 'block' }}
        />
      ) : item.type === 'mp4' ? (
        <video
          src={item.url}
          muted
          loop
          autoPlay
          playsInline
          draggable={false}
          style={{ width: `${itemWidth}px`, height: `${IMG_HEIGHT}px`, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <PdfThumbnail url={item.thumbnailUrl || item.url} width={itemWidth} />
      )}
      <div style={{
        padding: '0.35rem 0.6rem',
        color: highlighted ? '#fff' : '#aaa',
        fontSize: '0.8rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {item.title}
      </div>
    </div>
  );
}

function HorizontalStrip({ items, onItemClick, highlightedItem, onHighlightDone }: {
  items: DesignItem[];
  onItemClick: (item: DesignItem) => void;
  highlightedItem?: DesignItem | null;
  onHighlightDone?: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const isPausedRef = useRef(false);
  const isFrozenRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, pos: 0 });
  const dragDistRef = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveRef = useRef({ x: 0, time: 0 });
  const SPEED = 0.5;
  const FRICTION = 0.95;
  const MIN_VELOCITY = 0.1;

  // Compute how many copies of items we need to fill the viewport + extra for seamless wrap.
  // We need at least 2 full sets, but if items are few/narrow we need more.
  const [repeatCount, setRepeatCount] = useState(3);
  const oneSetWidthRef = useRef(0);

  useEffect(() => {
    if (!viewportRef.current) return;
    // Estimate one-set width from items
    const GAP = 16;
    let setW = 0;
    for (const item of items) {
      setW += getItemWidth(item) + GAP;
    }
    oneSetWidthRef.current = setW;

    // Need enough copies so total > 2 * viewport width (one offscreen left, one right)
    const vpWidth = viewportRef.current.offsetWidth;
    const needed = Math.max(3, Math.ceil((vpWidth * 3) / Math.max(setW, 1)));
    setRepeatCount(needed);
  }, [items]);

  // Re-measure actual one-set width after render (accounts for actual DOM widths)
  useEffect(() => {
    if (!innerRef.current) return;
    const count = items.length;
    if (count === 0) return;
    const children = innerRef.current.children;
    let w = 0;
    for (let i = 0; i < count && i < children.length; i++) {
      w += (children[i] as HTMLElement).offsetWidth + 16;
    }
    oneSetWidthRef.current = w;
  }, [items, repeatCount]);

  function wrapPos() {
    const setW = oneSetWidthRef.current;
    if (setW <= 0) return;
    while (posRef.current > 0) posRef.current -= setW;
    while (posRef.current < -setW) posRef.current += setW;
  }

  // Handle nav-triggered highlight: scroll item to center and freeze
  useEffect(() => {
    if (!highlightedItem || !innerRef.current || !viewportRef.current) return;

    isFrozenRef.current = true;
    isPausedRef.current = true;

    // Find the first occurrence of this item in the duplicated list
    const idx = items.findIndex(it => it.title === highlightedItem.title);
    if (idx < 0) return;

    const children = innerRef.current.children;
    if (idx >= children.length) return;

    const child = children[idx] as HTMLElement;
    const childCenter = child.offsetLeft + child.offsetWidth / 2;
    const vpWidth = viewportRef.current.offsetWidth;
    const targetPos = -(childCenter - vpWidth / 2);

    posRef.current = targetPos;
    wrapPos();
    innerRef.current.style.transform = `translateX(${posRef.current}px)`;

    // Unfreeze after a delay
    const timer = setTimeout(() => {
      isFrozenRef.current = false;
      onHighlightDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [highlightedItem, items, onHighlightDone]);

  // Animation loop with inertia
  useEffect(() => {
    let animId: number;
    function tick() {
      if (innerRef.current && !isFrozenRef.current) {
        if (isDraggingRef.current) {
          // During drag, position is set by mouse handlers directly
        } else if (Math.abs(velocityRef.current) > MIN_VELOCITY) {
          // Inertia phase
          posRef.current += velocityRef.current;
          velocityRef.current *= FRICTION;
          if (Math.abs(velocityRef.current) <= MIN_VELOCITY) {
            velocityRef.current = 0;
          }
          wrapPos();
          innerRef.current.style.transform = `translateX(${posRef.current}px)`;
        } else if (!isPausedRef.current) {
          // Auto-scroll
          posRef.current -= SPEED;
          wrapPos();
          innerRef.current.style.transform = `translateX(${posRef.current}px)`;
        }
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pause when tab is hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) isPausedRef.current = true;
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    isDraggingRef.current = true;
    velocityRef.current = 0;
    dragDistRef.current = 0;
    dragStartRef.current = { x: e.clientX, pos: posRef.current };
    lastMoveRef.current = { x: e.clientX, time: performance.now() };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDraggingRef.current || !innerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    dragDistRef.current = Math.abs(dx);
    posRef.current = dragStartRef.current.pos + dx;
    wrapPos();
    innerRef.current.style.transform = `translateX(${posRef.current}px)`;

    const now = performance.now();
    const dt = now - lastMoveRef.current.time;
    if (dt > 0) {
      velocityRef.current = (e.clientX - lastMoveRef.current.x) / Math.max(dt, 1) * 16;
    }
    lastMoveRef.current = { x: e.clientX, time: now };
  }

  function onMouseUp() {
    isDraggingRef.current = false;
  }

  function onTouchStart(e: React.TouchEvent) {
    isDraggingRef.current = true;
    velocityRef.current = 0;
    dragDistRef.current = 0;
    const x = e.touches[0].clientX;
    dragStartRef.current = { x, pos: posRef.current };
    lastMoveRef.current = { x, time: performance.now() };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDraggingRef.current || !innerRef.current) return;
    const x = e.touches[0].clientX;
    const dx = x - dragStartRef.current.x;
    dragDistRef.current = Math.abs(dx);
    posRef.current = dragStartRef.current.pos + dx;
    wrapPos();
    innerRef.current.style.transform = `translateX(${posRef.current}px)`;

    const now = performance.now();
    const dt = now - lastMoveRef.current.time;
    if (dt > 0) {
      velocityRef.current = (x - lastMoveRef.current.x) / Math.max(dt, 1) * 16;
    }
    lastMoveRef.current = { x, time: now };
  }

  function onTouchEnd() {
    isDraggingRef.current = false;
  }

  function scrollByAmount(delta: number) {
    velocityRef.current = delta > 0 ? 8 : -8;
  }

  function handleItemClick(item: DesignItem) {
    if (dragDistRef.current > 5) return;
    onItemClick(item);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => scrollByAmount(200)}
        style={{
          position: 'absolute',
          left: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid #333',
          color: '#fff',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#666'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div
        ref={viewportRef}
        onMouseEnter={() => { if (!isFrozenRef.current) isPausedRef.current = true; }}
        onMouseLeave={() => { if (!isFrozenRef.current) isPausedRef.current = false; isDraggingRef.current = false; }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          overflow: 'hidden',
          cursor: 'grab',
          padding: '0.5rem 0',
          userSelect: 'none',
        }}
      >
        <div
          ref={innerRef}
          style={{
            display: 'flex',
            gap: '1rem',
            willChange: 'transform',
          }}
        >
          {Array.from({ length: repeatCount }, () => items).flat().map((item, i) => (
            <StripItem
              key={`${item.title}-${i}`}
              item={item}
              onClick={() => handleItemClick(item)}
              highlighted={highlightedItem?.title === item.title}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => scrollByAmount(-200)}
        style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid #333',
          color: '#fff',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#666'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

function ItemModal({ item, onClose }: { item: DesignItem; onClose: () => void }) {
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#141414',
          borderRadius: '1rem',
          border: '1px solid #222',
          maxWidth: '900px',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 1,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; }}
        >
          {'\u00D7'}
        </button>

        <div style={{ padding: '2rem' }}>
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.title}
              style={{
                width: '100%',
                borderRadius: '0.5rem',
                maxHeight: '60vh',
                objectFit: 'contain',
              }}
            />
          ) : item.type === 'mp4' ? (
            <video
              src={item.url}
              controls
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                borderRadius: '0.5rem',
                maxHeight: '60vh',
                objectFit: 'contain',
              }}
            />
          ) : (
            <PdfModalViewer url={item.url} />
          )}

          <h2 style={{
            fontFamily: 'CustomRegularBold, sans-serif',
            fontSize: '1.3rem',
            color: '#ffffff',
            margin: '1.5rem 0 0.5rem 0',
          }}>
            {item.title}
          </h2>
          <span style={{ color: '#666', fontSize: '0.85rem' }}>
            {item.date}
          </span>
          <p style={{
            color: '#aaa',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            marginTop: '0.75rem',
          }}>
            {item.description}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CollapsibleNav({ sections: navSections, activeSection, activeItemTitle, onNavigate, onItemNavigate }: {
  sections: DesignSection[];
  activeSection: string;
  activeItemTitle: string | null;
  onNavigate: (sectionId: string) => void;
  onItemNavigate: (sectionId: string, item: DesignItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Backdrop: closes nav when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 19,
          }}
        />
      )}

      {/* Toggle button — always visible, fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '4.5rem',
          left: '0.5rem',
          zIndex: 21,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Nav pane — matches Academic.tsx style with black background */}
      <nav style={{
        position: 'fixed',
        top: '0',
        left: '2rem',
        bottom: '0',
        width: isOpen ? '180px' : '0px',
        transition: 'width 0.3s ease',
        zIndex: 20,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#000000',
        borderRight: isOpen ? '1px solid #222' : 'none',
        paddingRight: isOpen ? '1.5rem' : '0',
        paddingTop: '6rem',
      }}>
        <div style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {navSections.map((section) => {
            const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
            const isActive = activeSection === section.title;
            return (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <a
                  href={`#${sectionId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(sectionId);
                  }}
                  style={{
                    color: isActive ? '#ffffff' : '#666',
                    fontSize: '0.9rem',
                    fontFamily: 'CustomRegularBold, sans-serif',
                    textDecoration: 'none',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '0.25rem',
                    backgroundColor: isActive ? '#1a1a1a' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#aaa'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#666'; }}
                >
                  {section.title}
                </a>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.15rem' }}>
                  {section.items.map((item) => {
                    const isItemActive = activeItemTitle === item.title;
                    return (
                      <a
                        key={item.title}
                        href={`#${sectionId}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onItemNavigate(sectionId, item);
                        }}
                        style={{
                          color: isItemActive ? '#ffffff' : '#555',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          padding: '0.2rem 0.75rem 0.2rem 1.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '160px',
                          backgroundColor: isItemActive ? '#1a1a1a' : 'transparent',
                          borderRadius: '0.25rem',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { if (!isItemActive) e.currentTarget.style.color = '#aaa'; }}
                        onMouseLeave={(e) => { if (!isItemActive) e.currentTarget.style.color = isItemActive ? '#ffffff' : '#555'; }}
                      >
                        {item.title}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function SectionCard({ section, id, onItemClick, highlightedItem, onHighlightDone }: {
  section: DesignSection;
  id: string;
  onItemClick: (item: DesignItem) => void;
  highlightedItem?: DesignItem | null;
  onHighlightDone?: () => void;
}) {
  return (
    <div id={id} style={{ marginBottom: '3rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.25rem',
      }}>
        <h2 style={{
          fontFamily: 'CustomRegularBold, sans-serif',
          fontSize: '1.3rem',
          color: '#ffffff',
          margin: 0,
        }}>
          {section.title}
        </h2>
        <span style={{
          color: '#666',
          fontSize: '0.85rem',
          fontFamily: 'CustomRegular, sans-serif',
          flexShrink: 0,
          marginLeft: '1rem',
        }}>
          {section.date}
        </span>
      </div>
      <p style={{
        color: '#666',
        fontSize: '0.9rem',
        margin: '0 0 1rem 0',
      }}>
        {section.description}
      </p>
      <HorizontalStrip
        items={section.items}
        onItemClick={onItemClick}
        highlightedItem={highlightedItem}
        onHighlightDone={onHighlightDone}
      />
    </div>
  );
}

export default function Design() {
  const [activeSection, setActiveSection] = useState(sections[0].title);
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  // Per-section highlighted item for nav-triggered scroll-to-center + visual highlight
  const [highlightedItems, setHighlightedItems] = useState<Record<string, DesignItem | null>>({});
  // Track the active item title in the nav (for nav highlight + strip highlight)
  const [activeItemTitle, setActiveItemTitle] = useState<string | null>(null);

  useEffect(() => {
    const ids = sections.map((s) => s.title.toLowerCase().replace(/\s+/g, '-'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = sections.find(
              (s) => s.title.toLowerCase().replace(/\s+/g, '-') === entry.target.id,
            );
            if (section) setActiveSection(section.title);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function navigateTo(sectionId: string) {
    setActiveItemTitle(null);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  const handleItemNavigate = useCallback((sectionId: string, item: DesignItem) => {
    // Scroll section into view, then highlight item in strip
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setHighlightedItems(prev => ({ ...prev, [sectionId]: item }));
    setActiveItemTitle(item.title);
  }, []);

  const handleHighlightDone = useCallback((sectionId: string) => {
    setHighlightedItems(prev => ({ ...prev, [sectionId]: null }));
    setActiveItemTitle(null);
  }, []);

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      padding: '3rem 3rem 3rem 5rem',
      display: 'flex',
      gap: '3rem',
    }}>
      <CollapsibleNav
        sections={sections}
        activeSection={activeSection}
        activeItemTitle={activeItemTitle}
        onNavigate={navigateTo}
        onItemNavigate={handleItemNavigate}
      />

      <div style={{ flex: 1, minWidth: 0, marginLeft: '48px' }}>
        <h1 style={{
          fontFamily: 'CustomTitle, sans-serif',
          fontSize: '2.5rem',
          color: '#ffffff',
          margin: '0 0 0.5rem 0',
        }}>
          Design
        </h1>
        <p style={{
          color: '#888',
          fontSize: '1.05rem',
          margin: '0 0 3rem 0',
        }}>
          A sample of commissioned and personal design work.
        </p>

        {sections.map((section) => {
          const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
          return (
            <SectionCard
              key={section.title}
              section={section}
              id={sectionId}
              onItemClick={(item) => setSelectedItem(item)}
              highlightedItem={highlightedItems[sectionId]}
              onHighlightDone={() => handleHighlightDone(sectionId)}
            />
          );
        })}
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
