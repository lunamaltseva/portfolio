import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { useIsMobile } from '../hooks/useIsMobile';

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
  aspect?: number;
}

interface DesignSection {
  title: string;
  description: string;
  date: string;
  items: DesignItem[];
}

const STRIP_HEIGHT = 200;
const STRIP_HEIGHT_MOBILE = 150;

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

function getItemWidth(item: DesignItem, isMobile: boolean): number {
  const stripH = isMobile ? STRIP_HEIGHT_MOBILE : STRIP_HEIGHT;
  const imgH = stripH - 40;
  const aspect = item.aspect || 1;
  const w = imgH * aspect;
  return Math.max(80, Math.min(isMobile ? 240 : 360, Math.round(w)));
}

function PdfThumbnail({ url, width, isMobile }: { url: string; width: number; isMobile: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgH = (isMobile ? STRIP_HEIGHT_MOBILE : STRIP_HEIGHT) - 40;

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
        height: `${imgH}px`,
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

function StripItem({ item, onClick, highlighted, isMobile }: { item: DesignItem; onClick: () => void; highlighted?: boolean; isMobile: boolean }) {
  const itemWidth = getItemWidth(item, isMobile);
  const imgH = (isMobile ? STRIP_HEIGHT_MOBILE : STRIP_HEIGHT) - 40;
  const stripH = isMobile ? STRIP_HEIGHT_MOBILE : STRIP_HEIGHT;

  return (
    <div
      onClick={onClick}
      style={{
        width: `${itemWidth}px`,
        height: `${stripH}px`,
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
          style={{ width: `${itemWidth}px`, height: `${imgH}px`, objectFit: 'cover', display: 'block' }}
        />
      ) : item.type === 'mp4' ? (
        <video
          src={item.url}
          muted
          loop
          autoPlay
          playsInline
          draggable={false}
          style={{ width: `${itemWidth}px`, height: `${imgH}px`, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <PdfThumbnail url={item.thumbnailUrl || item.url} width={itemWidth} isMobile={isMobile} />
      )}
      <div style={{
        padding: '0.35rem 0.6rem',
        color: highlighted ? '#fff' : '#aaa',
        fontSize: isMobile ? '0.7rem' : '0.8rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {item.title}
      </div>
    </div>
  );
}

function HorizontalStrip({ items, onItemClick, highlightedItem, onHighlightDone, isMobile }: {
  items: DesignItem[];
  onItemClick: (item: DesignItem) => void;
  highlightedItem?: DesignItem | null;
  onHighlightDone?: () => void;
  isMobile: boolean;
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

  const [repeatCount, setRepeatCount] = useState(3);
  const oneSetWidthRef = useRef(0);

  useEffect(() => {
    if (!viewportRef.current) return;
    const GAP = 16;
    let setW = 0;
    for (const item of items) {
      setW += getItemWidth(item, isMobile) + GAP;
    }
    oneSetWidthRef.current = setW;

    const vpWidth = viewportRef.current.offsetWidth;
    const needed = Math.max(3, Math.ceil((vpWidth * 3) / Math.max(setW, 1)));
    setRepeatCount(needed);
  }, [items, isMobile]);

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
  }, [items, repeatCount, isMobile]);

  function wrapPos() {
    const setW = oneSetWidthRef.current;
    if (setW <= 0) return;
    while (posRef.current > 0) posRef.current -= setW;
    while (posRef.current < -setW) posRef.current += setW;
  }

  useEffect(() => {
    if (!highlightedItem || !innerRef.current || !viewportRef.current) return;

    isFrozenRef.current = true;
    isPausedRef.current = true;

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

    const timer = setTimeout(() => {
      isFrozenRef.current = false;
      onHighlightDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [highlightedItem, items, onHighlightDone]);

  useEffect(() => {
    let animId: number;
    function tick() {
      if (innerRef.current && !isFrozenRef.current) {
        if (isDraggingRef.current) {
          // During drag, position is set by handlers directly
        } else if (Math.abs(velocityRef.current) > MIN_VELOCITY) {
          posRef.current += velocityRef.current;
          velocityRef.current *= FRICTION;
          if (Math.abs(velocityRef.current) <= MIN_VELOCITY) {
            velocityRef.current = 0;
          }
          wrapPos();
          innerRef.current.style.transform = `translateX(${posRef.current}px)`;
        } else if (!isPausedRef.current) {
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
      {!isMobile && (
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
      )}

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
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {!isMobile && (
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
      )}
    </div>
  );
}

function ItemModal({ item, onClose, isMobile }: { item: DesignItem; onClose: () => void; isMobile: boolean }) {
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
        padding: isMobile ? '1rem' : '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#141414',
          borderRadius: isMobile ? '0.75rem' : '1rem',
          border: '1px solid #222',
          maxWidth: isMobile ? '100%' : '900px',
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
            top: '0.75rem',
            right: '0.75rem',
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

        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
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
            fontSize: isMobile ? '1.1rem' : '1.3rem',
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

function FixedNav({ sections: navSections, activeSection, activeItemTitle, onNavigate, onItemNavigate }: {
  sections: DesignSection[];
  activeSection: string;
  activeItemTitle: string | null;
  onNavigate: (sectionId: string) => void;
  onItemNavigate: (sectionId: string, item: DesignItem) => void;
}) {
  return (
    <nav style={{
      position: 'fixed',
      top: '6rem',
      left: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      borderRight: '1px solid #222',
      paddingRight: '1.5rem',
      zIndex: 10,
      maxHeight: 'calc(100vh - 8rem)',
      overflowY: 'auto',
    }}>
      {navSections.map((section) => {
        const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
        const isSectionActive = activeSection === section.title && !activeItemTitle;
        return (
          <div key={section.title} style={{ display: 'flex', flexDirection: 'column' }}>
            <a
              href={`#${sectionId}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(sectionId);
              }}
              style={{
                color: isSectionActive ? '#ffffff' : '#666',
                fontSize: '0.9rem',
                fontFamily: 'CustomRegularBold, sans-serif',
                textDecoration: 'none',
                padding: '0.3rem 0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: isSectionActive ? '#1a1a1a' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSectionActive) e.currentTarget.style.color = '#aaa';
              }}
              onMouseLeave={(e) => {
                if (!isSectionActive) e.currentTarget.style.color = '#666';
              }}
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
                    onMouseEnter={(e) => {
                      if (!isItemActive) e.currentTarget.style.color = '#aaa';
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemActive) e.currentTarget.style.color = '#555';
                    }}
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function SectionCard({ section, id, onItemClick, highlightedItem, onHighlightDone, isMobile }: {
  section: DesignSection;
  id: string;
  onItemClick: (item: DesignItem) => void;
  highlightedItem?: DesignItem | null;
  onHighlightDone?: () => void;
  isMobile: boolean;
}) {
  return (
    <div id={id} style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.25rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <h2 style={{
          fontFamily: 'CustomRegularBold, sans-serif',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
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
        isMobile={isMobile}
      />
    </div>
  );
}

export default function Design() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(sections[0].title);
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  const [highlightedItems, setHighlightedItems] = useState<Record<string, DesignItem | null>>({});
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
      padding: isMobile ? '1.5rem' : '3rem 3rem 3rem 5rem',
      display: 'flex',
      gap: isMobile ? '0' : '3rem',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      {!isMobile && (
        <FixedNav
          sections={sections}
          activeSection={activeSection}
          activeItemTitle={activeItemTitle}
          onNavigate={navigateTo}
          onItemNavigate={handleItemNavigate}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, marginLeft: isMobile ? '0' : '180px' }}>
        <h1 style={{
          fontFamily: 'CustomTitle, sans-serif',
          fontSize: isMobile ? '2rem' : '2.5rem',
          color: '#ffffff',
          margin: '0 0 0.5rem 0',
        }}>
          Design
        </h1>
        <p style={{
          color: '#888',
          fontSize: isMobile ? '0.95rem' : '1.05rem',
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
              isMobile={isMobile}
            />
          );
        })}
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} isMobile={isMobile} />
      )}
    </div>
  );
}
