import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useIsMobile } from '../hooks/useIsMobile';
import { NAV_ITEMS, NAV_LEFT, NAV_RIGHT, type NavItem } from '../components/navData';
import { ICONS_BY_HREF } from '../components/navIcons';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SCARLET  = '#dc2626';
const SCARLET2 = '#b91c1c';
const BRAND    = '#005ea5';
const CALLOUT_BG = '#fbfbf7';

const B = {
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  brand600: '#005ea5',
  brand700: '#004b84',
  brand50:  '#e6f2fb',
  success: '#16a34a',
  warning: '#fbbf24',
  danger:  '#f87171',
  gold:    '#d3bc7a',
} as const;

const card: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${B.gray200}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
};

const eyebrow: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: B.gray500,
};

// ── Navbar ────────────────────────────────────────────────────────────────────
function ThemedDropdown({ label, items, mob }: { label: string; items: { label: string; href: string; external?: boolean }[]; mob: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => !mob && setOpen(true)}
      onMouseLeave={() => !mob && setOpen(false)}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(255,255,255,0.14)' : 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.92)',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          fontWeight: 500,
          padding: '0.4rem 0.75rem',
          borderRadius: 4,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: 220,
          width: 'max-content',
          background: '#fff',
          border: `1px solid ${B.gray200}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '0.4rem 0',
          zIndex: 1100,
        }}>
          {items.map((item) => {
            const Icon = ICONS_BY_HREF[item.href];
            return (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.9rem',
                  color: B.gray800,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = B.brand50)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {Icon && <Icon size={15} style={{ color: BRAND }} />}
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemedNavbar() {
  const mob = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const renderItem = (item: NavItem) => {
    if (item.dropdown) {
      return <ThemedDropdown key={item.label} label={item.label} items={item.dropdown} mob={mob} />;
    }
    const Icon = item.href ? ICONS_BY_HREF[item.href] : undefined;
    return (
      <a
        key={item.href}
        href={item.href}
        style={{
          color: 'rgba(255,255,255,0.92)',
          fontSize: '0.9rem',
          fontWeight: 500,
          padding: '0.4rem 0.75rem',
          borderRadius: 4,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {Icon && <Icon size={15} />}
        <span>{item.label}</span>
      </a>
    );
  };

  const title = (
    <a href="/" style={{ color: '#fff', fontSize: mob ? '1rem' : '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', textDecoration: 'none', flexShrink: 0 }}>
      Luna Maltseva
    </a>
  );

  return (
    <nav style={{
      background: SCARLET,
      borderBottom: `1px solid ${SCARLET2}`,
      padding: mob ? '0 1rem' : '0 2rem',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: mob ? '0.5rem' : '2rem',
    }}>
      {!mob ? (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
            {NAV_LEFT.map(renderItem)}
          </div>
          {title}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.25rem' }}>
            {NAV_RIGHT.map(renderItem)}
          </div>
        </>
      ) : (
        <>
          {title}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', color: '#fff', padding: '0.4rem', cursor: 'pointer', display: 'flex', position: 'absolute', right: mob ? '1rem' : '2rem', top: '50%', transform: 'translateY(-50%)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              borderBottom: `1px solid ${B.gray200}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: '0.5rem 0',
              zIndex: 1099,
            }}>
              {NAV_ITEMS.flatMap((item) => {
                if (item.dropdown) {
                  return [
                    <div key={`cat-${item.label}`} style={{ padding: '0.7rem 1rem 0.3rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: B.gray500, fontWeight: 600 }}>{item.label}</div>,
                    ...item.dropdown.map((sub) => {
                      const Icon = ICONS_BY_HREF[sub.href];
                      return (
                        <a
                          key={sub.href}
                          href={sub.href}
                          target={sub.external ? '_blank' : undefined}
                          rel={sub.external ? 'noopener noreferrer' : undefined}
                          onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 1.25rem', color: B.gray800, fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none' }}
                        >
                          {Icon && <Icon size={16} style={{ color: BRAND }} />}
                          <span>{sub.label}</span>
                        </a>
                      );
                    }),
                  ];
                }
                const Icon = item.href ? ICONS_BY_HREF[item.href] : undefined;
                return [
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 1rem', color: B.gray800, fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {Icon && <Icon size={16} style={{ color: SCARLET }} />}
                    <span>{item.label}</span>
                  </a>,
                ];
              })}
            </div>
          )}
        </>
      )}
    </nav>
  );
}

// ── PDF preview ───────────────────────────────────────────────────────────────
function PdfPreview({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const pdf = await pdfjsLib.getDocument(encodeURI(url)).promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 1600 / base.width });
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
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: 820,
        height: 'auto',
        margin: '0 auto',
        borderRadius: 10,
        border: `1px solid ${B.gray300}`,
      }}
    />
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'What actually is Artemis CE?', a: 'A Real-Time Management System for Civic Engagement (or RTMSCE) is a data-oriented grant management system defined by a set of approaches, policies, schemes, designs, and tools. All elements of the system were tailored specifically for managing and analyzing Civic Engagement projects in order to support them with statistics.' },
  { q: 'Why be "data-oriented"?', a: 'With data, we can better understand the impact that we are making. Data allows us to make statements with certainty. If we reach a surprising conclusion, we can back it with data.' },
  { q: 'If I don\'t study at AUCA, can I still use Artemis CE?', a: 'Absolutely! While the full toolset might not be available, we do have public resources (like our toolset repository!) to aid student leaders in collecting and analyzing quality data in order to continue their project!' },
  { q: 'If I want to implement Artemis CE at my home institution, how do I do that?', a: 'Reach out to Luna, preferably in person. We are always looking for new partners to expand this project!'},
];

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ borderBottom: `1px solid ${B.gray200}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', padding: '18px 0',
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: B.gray900, lineHeight: 1.4 }}>{q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SCARLET} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ paddingBottom: 18 }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: B.gray600, lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RtmsCE() {
  const isMobile = useIsMobile();
  const maxW = 900;
  const px = isMobile ? '1.25rem' : '2.5rem';

  return (
    <div style={{
      background: '#fff',
      minHeight: '100vh',
      fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <ThemedNavbar />

      <div style={{ paddingTop: 56 }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: isMobile ? `2.5rem ${px}` : `4rem ${px}` }}>

          {/* ── Quote ─────────────────────────────────────────────────────── */}
          <section style={{
            padding: isMobile ? '16px 18px' : '24px 28px',
            background: CALLOUT_BG,
            borderLeft: `4px solid ${SCARLET}`,
            borderRadius: '0 8px 8px 0',
            marginBottom: '3rem',
          }}>
            <p style={{ margin: 0, color: B.gray900, fontSize: isMobile ? 16 : 19, lineHeight: 1.55 }}>
              We have all of these amazing stories with no data to back them up.
            </p>
          </section>

          {/* ── Paragraph 1 ────────────────────────────────────────────────── */}
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: B.gray700, margin: '0 0 4rem' }}>
            Civic engagement is traditionally a narrative-based field, full of rich stories. 
            The world, on the other hand, is becoming more and more data-oriented by the day.
          </p>

          {/* ── Intro heading ─────────────────────────────────────────────── */}
          <p style={{
            textAlign: 'center',
            fontSize: isMobile ? '1.6rem' : '2rem',
            fontWeight: 700,
            color: B.gray900,
            margin: '0 0 3rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Introducing Artemis CE
          </p>

          {/* ── Presentation preview ──────────────────────────────────────── */}
          <div style={{ marginBottom: isMobile ? '3rem' : '5rem' }}>
            <PdfPreview url="/design/RTMSCEPresentation.pdf" />
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <a
                href="/design/RTMSCEPresentation.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: B.gray700,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                Open the full presentation (PDF)
              </a>
            </div>
          </div>

          {/* ── Paragraph 2 ───────────────────────────────────────────────── */}
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: B.gray700, margin: '0 0 4rem' }}>
            "Artemis CE" is a digital, data-oriented framework for civic engagement which combines narratives with data to enable inferential decision making among student leaders and coordinates alike.
            The project has been in development for over twenty months, and has been built to directly enhance the capabilities of civic engagement projects on all sides.
            It has been deployed for 2 semesters at the AUCA Center for Civic Engagement for their "Student Initiative Development Program."
            The system aims to have a full launch on the web in February of 2027.
          </p>
          
          <section style={{
            padding: isMobile ? '16px 18px' : '24px 28px',
            background: CALLOUT_BG,
            borderLeft: `4px solid ${SCARLET}`,
            borderRadius: '0 8px 8px 0',
            marginBottom: '3rem',
          }}>
            <p style={{ margin: 0, color: B.gray900, fontSize: isMobile ? 16 : 19, lineHeight: 1.55 }}>
              We believe that every project has the capacity to be data-oriented.
            </p>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ ...eyebrow, color: SCARLET, marginBottom: 8 }}>FAQ</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: B.gray900, margin: 0, letterSpacing: '-0.01em' }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div style={{ borderTop: `1px solid ${B.gray200}` }}>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} defaultOpen={true} />
              ))}
            </div>
          </div>

          {/* ── Contact ───────────────────────────────────────────────────── */}
          <div style={{
            padding: isMobile ? '1.75rem 1.25rem' : '3rem 2.5rem',
            background: CALLOUT_BG,
            borderLeft: `4px solid ${SCARLET}`,
            borderRadius: '0 8px 8px 0',
            marginBottom: '4rem',
          }}>
            <div style={{ ...eyebrow, color: SCARLET, marginBottom: 10 }}>Contact</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: B.gray900, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
              We would love to work with you!
            </h2>
            <p style={{ fontSize: '0.95rem', color: B.gray600, margin: '0 0 1.75rem', lineHeight: 1.7 }}>
              Do not hesitate to reach out: that's what Get Engaged is for!
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <a href="mailto:luna@lunamaltseva.dev" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: SCARLET, color: '#fff',
                padding: '0.6rem 1.25rem', borderRadius: 7,
                fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                transition: 'background 150ms ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = SCARLET2)}
                onMouseLeave={e => (e.currentTarget.style.background = SCARLET)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                luna@lunamaltseva.dev
              </a>
              <a href="https://instagram.com/lunamaltseva" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: SCARLET,
                padding: '0.6rem 1.25rem', borderRadius: 7,
                fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                border: `1.5px solid ${SCARLET}`,
                transition: 'background 150ms ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @lunamaltseva
              </a>
            </div>
          </div>

          {/* ── Toolkit repository ─────────────────────────────────────────── */}
          <section style={{
            ...card,
            padding: isMobile ? '1.5rem 1.25rem' : '2rem 2.25rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? '1.25rem' : '2rem',
            }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: B.gray900, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
                  Artemis CE Data Science Toolkit
                </h2>
                <p style={{ fontSize: '0.95rem', color: B.gray600, margin: 0, lineHeight: 1.7 }}>
                  This is a public repository for student leaders in the area of civic engagement to perform data analysis on field data.
                </p>
              </div>
              <a
                href="https://github.com/lunamaltseva/RTMSCE-DataScience-Toolkit"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: SCARLET,
                  color: '#fff',
                  padding: '0.65rem 1.2rem',
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'background 150ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = SCARLET2)}
                onMouseLeave={e => (e.currentTarget.style.background = SCARLET)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                View on GitHub
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
