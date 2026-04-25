import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// --- Data ---

interface CycleDay {
  day: number;
  phase: string;
  lh: number;
  estrogen: number;
  progesterone: number;
}

const CYCLE_DATA: CycleDay[] = [
  { day: 1,  phase: 'Menstrual',  lh: 4.53,  estrogen: 108.13, progesterone: 5.48  },
  { day: 2,  phase: 'Menstrual',  lh: 4.57,  estrogen: 97.49,  progesterone: 4.18  },
  { day: 3,  phase: 'Menstrual',  lh: 4.72,  estrogen: 91.07,  progesterone: 3.5   },
  { day: 4,  phase: 'Menstrual',  lh: 4.86,  estrogen: 89.16,  progesterone: 3.23  },
  { day: 5,  phase: 'Menstrual',  lh: 4.97,  estrogen: 89.7,   progesterone: 3.07  },
  { day: 6,  phase: 'Follicular', lh: 5.12,  estrogen: 91.39,  progesterone: 3.05  },
  { day: 7,  phase: 'Follicular', lh: 5.29,  estrogen: 94.16,  progesterone: 3.15  },
  { day: 8,  phase: 'Follicular', lh: 5.45,  estrogen: 98.59,  progesterone: 3.32  },
  { day: 9,  phase: 'Follicular', lh: 5.58,  estrogen: 104.06, progesterone: 3.57  },
  { day: 10, phase: 'Follicular', lh: 5.71,  estrogen: 109.7,  progesterone: 4.08  },
  { day: 11, phase: 'Follicular', lh: 6.09,  estrogen: 116.98, progesterone: 4.67  },
  { day: 12, phase: 'Follicular', lh: 6.86,  estrogen: 127.32, progesterone: 4.95  },
  { day: 13, phase: 'Follicular', lh: 7.97,  estrogen: 138.5,  progesterone: 4.78  },
  { day: 14, phase: 'Fertility',  lh: 9.2,   estrogen: 146.48, progesterone: 4.53  },
  { day: 15, phase: 'Fertility',  lh: 10.36, estrogen: 150.95, progesterone: 4.56  },
  { day: 16, phase: 'Fertility',  lh: 11.1,  estrogen: 152.55, progesterone: 4.91  },
  { day: 17, phase: 'Luteal',     lh: 11.02, estrogen: 151.31, progesterone: 5.44  },
  { day: 18, phase: 'Luteal',     lh: 10.1,  estrogen: 147.19, progesterone: 6.04  },
  { day: 19, phase: 'Luteal',     lh: 8.72,  estrogen: 142.91, progesterone: 6.71  },
  { day: 20, phase: 'Luteal',     lh: 7.49,  estrogen: 141.51, progesterone: 7.6   },
  { day: 21, phase: 'Luteal',     lh: 6.49,  estrogen: 145.17, progesterone: 8.93  },
  { day: 22, phase: 'Luteal',     lh: 5.78,  estrogen: 151.07, progesterone: 10.46 },
  { day: 23, phase: 'Luteal',     lh: 5.39,  estrogen: 153.21, progesterone: 11.5  },
  { day: 24, phase: 'Luteal',     lh: 5.32,  estrogen: 150.07, progesterone: 11.6  },
  { day: 25, phase: 'Luteal',     lh: 5.26,  estrogen: 145.41, progesterone: 11.05 },
  { day: 26, phase: 'Luteal',     lh: 5.1,   estrogen: 140.84, progesterone: 10.21 },
  { day: 27, phase: 'Luteal',     lh: 4.88,  estrogen: 132.98, progesterone: 8.97  },
  { day: 28, phase: 'Luteal',     lh: 4.66,  estrogen: 121.24, progesterone: 7.27  },
];

// Min-max normalisation — used for poem/phrase selection so full range maps to all 14 lines
const E_MIN  = Math.min(...CYCLE_DATA.map(d => d.estrogen));
const E_MAX  = Math.max(...CYCLE_DATA.map(d => d.estrogen));
const P_MIN  = Math.min(...CYCLE_DATA.map(d => d.progesterone));
const P_MAX  = Math.max(...CYCLE_DATA.map(d => d.progesterone));
const LH_MIN = Math.min(...CYCLE_DATA.map(d => d.lh));
const LH_MAX = Math.max(...CYCLE_DATA.map(d => d.lh));

// True-zero normalisation — used for graph display so 0 is true 0
const E_ABSMAX  = E_MAX;
const P_ABSMAX  = P_MAX;
const LH_ABSMAX = LH_MAX;

function normMinMax(v: number, min: number, max: number) { return (v - min) / (max - min); }
function normTrueZero(v: number, max: number) { return v / max; }

// Catmull-Rom arrays — two sets, one per normalisation
const E_RAW_POEM  = CYCLE_DATA.map(d => normMinMax(d.estrogen,     E_MIN,  E_MAX));
const P_RAW_POEM  = CYCLE_DATA.map(d => normMinMax(d.progesterone, P_MIN,  P_MAX));
const LH_RAW_POEM = CYCLE_DATA.map(d => normMinMax(d.lh,           LH_MIN, LH_MAX));

const E_RAW_GRAPH  = CYCLE_DATA.map(d => normTrueZero(d.estrogen,     E_ABSMAX));
const P_RAW_GRAPH  = CYCLE_DATA.map(d => normTrueZero(d.progesterone, P_ABSMAX));
const LH_RAW_GRAPH = CYCLE_DATA.map(d => normTrueZero(d.lh,           LH_ABSMAX));

// Catmull-Rom spline (periodic)
function catmullRom(arr: number[], t: number): number {
  const n = arr.length;
  const cycled = ((t % n) + n) % n;
  const i1 = Math.floor(cycled);
  const f  = cycled - i1;
  const p0 = arr[((i1 - 1) + n) % n];
  const p1 = arr[i1];
  const p2 = arr[(i1 + 1) % n];
  const p3 = arr[(i1 + 2) % n];
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * f +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
    (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f
  );
}

// For poem selection — min-max normalised, full [0,1] range
function interpolate(dayFrac: number): { e: number; p: number; lh: number } {
  return {
    e:  Math.max(0, Math.min(1, catmullRom(E_RAW_POEM,  dayFrac))),
    p:  Math.max(0, Math.min(1, catmullRom(P_RAW_POEM,  dayFrac))),
    lh: Math.max(0, Math.min(1, catmullRom(LH_RAW_POEM, dayFrac))),
  };
}

// For graph display — true-zero normalised, no upper clamp so spline peak isn't flattened
function interpolateGraph(dayFrac: number): { e: number; p: number; lh: number } {
  return {
    e:  Math.max(0, catmullRom(E_RAW_GRAPH,  dayFrac)),
    p:  Math.max(0, catmullRom(P_RAW_GRAPH,  dayFrac)),
    lh: Math.max(0, catmullRom(LH_RAW_GRAPH, dayFrac)),
  };
}

// --- Poems ---

const POEMS = [
  'But such a form as Grecian goldsmiths make!',
  'О, мы в себя вбираем истину на выдохе, а не на вдохе',
  'The old lie: Dulce et decorum est',
  'A plague o\u2019 both your houses',
  'A poet could not but be gay in such a jocund company',
  'Something is rotten in the state of Denmark',
  'So should I, after the tea and cakes and ices',
  'Let me not to the marriage of true minds admit impediments',
  'Let him kiss me with the kisses of his mouth: for thy love is better than wine.',
  'It matters not how strait the gait',
  'Please tell me in two words what you was going to tell in a thousands',
  'To strive, to seek, to find, and not to yield',
  'I have measured out my life with coffee spoons',
  'Do not go gentle into that good night',
];

const N = POEMS.length; // 14

// highest hormone (1.0) → index 0 (poem 1); lowest (0.0) → index 13 (poem 14)
function hormoneLine(v: number): number {
  return N - 1 - Math.min(N - 1, Math.floor(v * N));
}

// --- Sentence phrases (all verified substrings of their poem line) ---

const E_NPS: string[] = [
  'such a form',                      // 0
  'истину',                           // 1
  'the old lie',                      // 2
  'both your houses',                 // 3
  'such a jocund company',            // 4
  'the state of Denmark',             // 5
  'the tea and cakes and ices',       // 6
  'the marriage of true minds',       // 7
  'the kisses of his mouth',          // 8
  'the gait',                         // 9
  'a thousands',                      // 10
  'not to yield',                     // 11
  'coffee spoons',                    // 12
  'that good night',                  // 13
];

const LH_NPS: string[] = [
  'Grecian goldsmiths',               // 0
  'на выдохе',                        // 1
  'Dulce et decorum est',             // 2
  'a plague',                         // 3
  'a poet',                           // 4
  'is rotten',                        // 5
  'after the tea and cakes and ices', // 6
  'impediments',                      // 7
  'love is better than wine',         // 8
  'how strait the gait',              // 9
  'two words',                        // 10
  'to seek, to find',                 // 11
  'my life',                          // 12
  'good night',                       // 13
];

const P_VERBS: string[] = [
  'make',                             // 0
  'вбираем',                          // 1
  'Dulce et decorum est',             // 2
  'plague',                           // 3
  'could not but be gay',             // 4
  'is rotten',                        // 5
  'should I',                         // 6
  'admit',                            // 7
  'kiss me',                          // 8
  'matters not',                      // 9
  'tell me',                          // 10
  'strive',                           // 11
  'measured out',                     // 12
  'go gentle',                        // 13
];

function buildSentence(eIdx: number, pIdx: number, lhIdx: number): string {
  return `${E_NPS[eIdx]} ${P_VERBS[pIdx]} ${LH_NPS[lhIdx]}`;
}

// Highlight verified substrings within a poem line
function renderLine(
  text: string,
  highlights: { phrase: string; color: string }[],
): React.ReactNode {
  type Span = { start: number; end: number; color: string };
  const spans: Span[] = [];
  for (const { phrase, color } of highlights) {
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) continue;
    spans.push({ start: idx, end: idx + phrase.length, color });
  }
  if (spans.length === 0) return text;
  spans.sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const s of spans) {
    if (merged.length && s.start < merged[merged.length - 1].end) continue;
    merged.push(s);
  }
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const { start, end, color } of merged) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<span key={start} style={{ color }}>{text.slice(start, end)}</span>);
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

// --- Phases ---

const PHASES = [
  { name: 'Menstrual',  start: 1,  end: 5  },
  { name: 'Follicular', start: 6,  end: 13 },
  { name: 'Fertility',  start: 14, end: 16 },
  { name: 'Luteal',     start: 17, end: 28 },
];

// --- Colors ---

const COLOR_E  = '#b06090';
const COLOR_P  = '#c8a800';
const COLOR_LH = '#3a72c8';

// --- Graph layout ---

const PAD_L     = 2;
const PAD_R     = 0;
const PAD_TOP   = 12;  // headroom so Catmull-Rom overshoot isn't clipped
const PAD_PHASE = 18;
const PAD_DAYS  = 18;
const PAD_BOT   = PAD_PHASE + PAD_DAYS;
const VIEW_DAYS = 28;

// Scale factors applied to P and LH on the graph so estrogen is dominant
const GRAPH_SCALE_P  = 0.6
const GRAPH_SCALE_LH = 0.7;

function makeHelpers(innerW: number, innerH: number) {
  function dayToX(day: number, offset: number) {
    return PAD_L + ((day - offset) / VIEW_DAYS) * innerW;
  }
  function valToY(v: number) {
    return PAD_TOP + innerH - v * innerH;
  }
  const GRAPH_SCALE: Record<'e' | 'p' | 'lh', number> = {
    e: 0.82,
    p: GRAPH_SCALE_P,
    lh: GRAPH_SCALE_LH,
  };

  // dayFrac passed to interpolateGraph is 0-indexed; offsetDay is 1-based
  function buildPath(offsetDay: number, key: 'e' | 'p' | 'lh'): string {
    const startDay = offsetDay - 0.5;
    const endDay   = offsetDay + VIEW_DAYS + 0.5;
    const steps    = Math.ceil((endDay - startDay) * 12);
    let d = '';
    for (let s = 0; s <= steps; s++) {
      const df   = startDay + (s / steps) * (endDay - startDay);
      const vals = interpolateGraph(df - 1);
      const x    = dayToX(df, offsetDay);
      const y    = valToY(vals[key] * GRAPH_SCALE[key]);
      d += s === 0 ? `M ${x.toFixed(2)},${y.toFixed(2)}` : ` L ${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return d;
  }
  return { dayToX, buildPath };
}

// --- SVG icon buttons ---

function IconBtn({
  onClick, disabled, children, title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      background: 'none', border: '1px solid #bbb', borderRadius: '3px',
      padding: '4px 8px', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.35 : 1, display: 'flex',
      alignItems: 'center', justifyContent: 'center', lineHeight: 0,
    }}>
      {children}
    </button>
  );
}

function SlowerIcon() {
  return <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <polygon points="8,1 1,7 8,13" fill="#444" />
    <polygon points="15,1 8,7 15,13" fill="#444" />
  </svg>;
}
function FasterIcon() {
  return <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <polygon points="1,1 8,7 1,13" fill="#444" />
    <polygon points="8,1 15,7 8,13" fill="#444" />
  </svg>;
}
function PlayIcon() {
  return <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
    <polygon points="1,1 11,7 1,13" fill="#444" />
  </svg>;
}
function PauseIcon() {
  return <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
    <rect x="1" y="1" width="4" height="12" fill="#444" />
    <rect x="7" y="1" width="4" height="12" fill="#444" />
  </svg>;
}

// --- Graph ---

interface GraphProps {
  offsetDay: number;
  width: number;
  height: number;
  onDragOffset: (v: number) => void;
}

function CycleGraph({ offsetDay, width, height, onDragOffset }: GraphProps) {
  const innerW = width - PAD_L - PAD_R;
  const innerH = height - PAD_TOP - PAD_BOT;
  const { dayToX, buildPath } = makeHelpers(innerW, innerH);

  const pathE  = buildPath(offsetDay, 'e');
  const pathP  = buildPath(offsetDay, 'p');
  const pathLH = buildPath(offsetDay, 'lh');

  // Compute rep range dynamically so labels never run out regardless of offsetDay
  const repMin = Math.floor((offsetDay - 1) / 28) - 1;
  const repMax = Math.ceil((offsetDay + VIEW_DAYS) / 28) + 1;

  const ovulationXs: number[] = [];
  for (let rep = repMin; rep <= repMax; rep++) {
    const x = dayToX(14 + rep * 28, offsetDay);
    if (x >= PAD_L && x <= PAD_L + innerW) ovulationXs.push(x);
  }

  const phaseItems: { name: string; cx: number; x1: number; clipX: number; clipW: number }[] = [];
  for (let rep = repMin; rep <= repMax; rep++) {
    PHASES.forEach(ph => {
      const x1 = dayToX(ph.start + rep * 28, offsetDay);
      const x2 = dayToX(ph.end + 1 + rep * 28, offsetDay);
      if (x2 > PAD_L && x1 < PAD_L + innerW) {
        const clipX = Math.max(x1, PAD_L);
        const clipW = Math.min(x2, PAD_L + innerW) - clipX;
        phaseItems.push({
          name: ph.name,
          cx: (clipX + clipX + clipW) / 2,
          x1: clipX,
          clipX,
          clipW,
        });
      }
    });
  }

  const dayTickItems: { label: number; x: number }[] = [];
  for (let rep = repMin; rep <= repMax; rep++) {
    [1, 14, 28].forEach(d => {
      const x = dayToX(d + rep * 28, offsetDay);
      if (x >= PAD_L && x <= PAD_L + innerW) dayTickItems.push({ label: d, x });
    });
  }

  const dragRef  = useRef<{ startX: number; startOffset: number } | null>(null);
  const touchRef = useRef<{ startX: number; startOffset: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startOffset: offsetDay };
    e.preventDefault();
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    onDragOffset(dragRef.current.startOffset - ((e.clientX - dragRef.current.startX) / innerW) * VIEW_DAYS);
  }
  function onMouseUp() { dragRef.current = null; }

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { startX: e.touches[0].clientX, startOffset: offsetDay };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchRef.current) return;
    onDragOffset(touchRef.current.startOffset - ((e.touches[0].clientX - touchRef.current.startX) / innerW) * VIEW_DAYS);
  }
  function onTouchEnd() { touchRef.current = null; }

  return (
    <svg width={width} height={height}
      style={{ display: 'block', fontFamily: 'monospace', cursor: 'grab', userSelect: 'none' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <clipPath id="graph-clip">
        <rect x={PAD_L} y={PAD_TOP} width={innerW} height={innerH} />
      </clipPath>

      <rect x={PAD_L} y={PAD_TOP} width={innerW} height={innerH} fill="#ffffff" />

      {ovulationXs.map((x, i) => (
        <g key={i} clipPath="url(#graph-clip)">
          <line x1={x} y1={PAD_TOP} x2={x} y2={PAD_TOP + innerH} stroke="#ddd" strokeWidth={1} strokeDasharray="4,3" />
          <text x={x + 3} y={PAD_TOP + 11} fontSize={8} fill="#bbb">ovulation</text>
        </g>
      ))}

      <path d={pathE}  fill="none" stroke={COLOR_E}  strokeWidth={1.5} clipPath="url(#graph-clip)" />
      <path d={pathP}  fill="none" stroke={COLOR_P}  strokeWidth={1.5} clipPath="url(#graph-clip)" />
      <path d={pathLH} fill="none" stroke={COLOR_LH} strokeWidth={1.5} clipPath="url(#graph-clip)" />

      {/* Reading line */}
      <line x1={PAD_L} y1={PAD_TOP} x2={PAD_L} y2={PAD_TOP + innerH} stroke="#aaa" strokeWidth={1} />

      {/* Bottom + left borders */}
      <line x1={PAD_L} y1={PAD_TOP + innerH} x2={PAD_L + innerW} y2={PAD_TOP + innerH} stroke="#ccc" strokeWidth={1} />
      <line x1={PAD_L} y1={PAD_TOP} x2={PAD_L} y2={PAD_TOP + innerH} stroke="#ccc" strokeWidth={1} />

      {phaseItems.map(({ name, cx, x1, clipX, clipW }, i) => (
        <g key={i}>
          <clipPath id={`phase-clip-${i}`}>
            <rect x={clipX} y={PAD_TOP + innerH} width={clipW} height={PAD_PHASE} />
          </clipPath>
          <line x1={x1} y1={PAD_TOP + innerH} x2={x1} y2={PAD_TOP + innerH + PAD_PHASE} stroke="#e0e0e0" strokeWidth={1} />
          <text
            x={cx} y={PAD_TOP + innerH + PAD_PHASE - 4}
            textAnchor="middle" fontSize={8} fill="#999"
            clipPath={`url(#phase-clip-${i})`}
          >{name}</text>
        </g>
      ))}

      {dayTickItems.map(({ label, x }, i) => (
        <text key={i} x={x} y={PAD_TOP + innerH + PAD_PHASE + PAD_DAYS - 4} textAnchor="middle" fontSize={9} fill="#777">
          {label}
        </text>
      ))}

      <g transform={`translate(${PAD_L + innerW - 6}, 14)`}>
        <line x1={-96} y1={0}  x2={-82} y2={0}  stroke={COLOR_E}  strokeWidth={1.5} />
        <text x={-79} y={4}   fontSize={9} fill={COLOR_E}  textAnchor="start">Estrogen</text>
        <line x1={-96} y1={14} x2={-82} y2={14} stroke={COLOR_P}  strokeWidth={1.5} />
        <text x={-79} y={18}  fontSize={9} fill={COLOR_P}  textAnchor="start">Progesterone</text>
        <line x1={-96} y1={28} x2={-82} y2={28} stroke={COLOR_LH} strokeWidth={1.5} />
        <text x={-79} y={32}  fontSize={9} fill={COLOR_LH} textAnchor="start">LH</text>
      </g>
    </svg>
  );
}

// --- Speed steps: index 0 = fastest, last = slowest ---
const SPEED_STEPS = [0.2, 0.5, 1, 2, 5, 10, 20];
const DEFAULT_SPEED_IDX = 4; // 5 s/day

export default function Poetry() {
  const isMobile = useIsMobile();

  const [dayFrac,    setDayFrac]    = useState(1.0);
  const [speedIdx,   setSpeedIdx]   = useState(DEFAULT_SPEED_IDX);
  const [paused,     setPaused]     = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const speed = SPEED_STEPS[speedIdx];

  const lastTsRef = useRef<number | null>(null);
  const rafRef    = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    if (lastTsRef.current !== null) {
      setDayFrac(d => d + (ts - lastTsRef.current!) / 1000 / speed);
    }
    lastTsRef.current = ts;
    rafRef.current = requestAnimationFrame(tick);
  }, [speed]);

  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [paused, tick]);

  // When unpausing, if the user has dragged, absorb the drag offset into dayFrac
  // so playback continues from where the graph was left
  const prevPaused = useRef(paused);
  useEffect(() => {
    if (prevPaused.current && !paused && dragOffset !== null) {
      setDayFrac(dragOffset);
      setDragOffset(null);
    }
    prevPaused.current = paused;
  }, [paused, dragOffset]);

  const offsetDay = dragOffset !== null ? dragOffset : dayFrac;

  const vals     = interpolate(offsetDay - 1);
  const eIdx     = hormoneLine(vals.e);
  const pIdx     = hormoneLine(vals.p);
  const lhIdx    = hormoneLine(vals.lh);
  const sentence = buildSentence(eIdx, pIdx, lhIdx);

  // Measure poem lines height (excludes sentence) to match graph height on desktop
  const poemLinesRef = useRef<HTMLDivElement>(null);
  const [poemHeight, setPoemHeight] = useState(500);
  useEffect(() => {
    const el = poemLinesRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setPoemHeight(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure graph column width
  const graphColRef = useRef<HTMLDivElement>(null);
  const [graphW, setGraphW] = useState(600);
  useEffect(() => {
    const el = graphColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setGraphW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphH = isMobile ? 220 : poemHeight;
  const font   = 'Georgia, serif';
  const fontSize = isMobile ? '1rem' : '1.25rem';
  const pad    = isMobile ? '1.5rem 1rem' : '3rem 2.5rem';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: pad, boxSizing: 'border-box' }}>
      <h1 style={{ fontFamily: font, fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 400, color: '#000', marginBottom: isMobile ? '1.25rem' : '2rem' }}>
        MClock by Daria &amp; Luna
      </h1>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1.5rem' : '3rem',
        alignItems: 'flex-start',
      }}>
        {/* Poems */}
        <div style={{ flex: '0 0 auto', minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <div ref={poemLinesRef}>
            {POEMS.map((line, i) => {
              const isActive = i === eIdx || i === pIdx || i === lhIdx;
              const highlights: { phrase: string; color: string }[] = [];
              if (i === eIdx)  highlights.push({ phrase: E_NPS[i],   color: COLOR_E  });
              if (i === pIdx)  highlights.push({ phrase: P_VERBS[i], color: COLOR_P  });
              if (i === lhIdx) highlights.push({ phrase: LH_NPS[i],  color: COLOR_LH });
              return (
                <div key={i} style={{ marginBottom: isMobile ? '0.35rem' : '0.55rem', opacity: isActive ? 1 : 0.22 }}>
                  <span style={{ fontFamily: font, fontSize, color: '#111', lineHeight: 1.65 }}>
                    {renderLine(line, highlights)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: isMobile ? '1rem' : '1.75rem',
            fontFamily: font,
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: '#444', fontStyle: 'italic',
            paddingLeft: isMobile ? '0' : '3rem',
            maxWidth: '520px', lineHeight: 1.7,
          }}>
            {sentence}
          </div>
        </div>

        {/* Graph + controls */}
        <div ref={graphColRef} style={{ flex: isMobile ? '0 0 auto' : '1 1 0', minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <CycleGraph offsetDay={offsetDay} width={graphW} height={graphH} onDragOffset={setDragOffset} />

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <IconBtn onClick={() => setSpeedIdx(i => Math.min(SPEED_STEPS.length - 1, i + 1))} disabled={speedIdx >= SPEED_STEPS.length - 1} title="Slower">
              <SlowerIcon />
            </IconBtn>
            <IconBtn onClick={() => setPaused(p => !p)} title={paused ? 'Play' : 'Pause'}>
              {paused ? <PlayIcon /> : <PauseIcon />}
            </IconBtn>
            <IconBtn onClick={() => setSpeedIdx(i => Math.max(0, i - 1))} disabled={speedIdx <= 0} title="Faster">
              <FasterIcon />
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
