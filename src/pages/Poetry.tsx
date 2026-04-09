import { useState, useEffect, useRef, useCallback } from 'react';

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

// Normalise each hormone to [0, 1]
const E_MIN = Math.min(...CYCLE_DATA.map(d => d.estrogen));
const E_MAX = Math.max(...CYCLE_DATA.map(d => d.estrogen));
const P_MIN = Math.min(...CYCLE_DATA.map(d => d.progesterone));
const P_MAX = Math.max(...CYCLE_DATA.map(d => d.progesterone));
const L_MIN = Math.min(...CYCLE_DATA.map(d => d.lh));
const L_MAX = Math.max(...CYCLE_DATA.map(d => d.lh));

function norm(v: number, min: number, max: number) {
  return (v - min) / (max - min);
}

// Interpolate between two cycle days at a fractional day position (0-indexed, 0=day1)
function interpolate(dayFrac: number): { e: number; p: number; lh: number } {
  const total = CYCLE_DATA.length; // 28
  const cycled = ((dayFrac % total) + total) % total;
  const i = Math.floor(cycled);
  const t = cycled - i;
  const a = CYCLE_DATA[i];
  const b = CYCLE_DATA[(i + 1) % total];
  return {
    e:   norm(a.estrogen     + t * (b.estrogen     - a.estrogen),     E_MIN, E_MAX),
    p:   norm(a.progesterone + t * (b.progesterone - a.progesterone), P_MIN, P_MAX),
    lh:  norm(a.lh           + t * (b.lh           - a.lh),           L_MIN, L_MAX),
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

// Map a [0,1] hormone value to a line index (0-13)
function hormoneLine(v: number) {
  return Math.min(N - 1, Math.floor(v * N));
}

// --- Sentence phrases ---

// Estrogen selects noun phrase (14 options, two sets so E and LH don't clash)
const E_NOUNS = [
  'the pale morning',
  'a red wheel barrow',
  'the tide at ebb',
  'an unmarked door',
  'the cold October',
  'a broken compass',
  'the slow fever',
  'an empty theatre',
  'the glass of water',
  'a long corridor',
  'the dying ember',
  'a silver mirror',
  'the open wound',
  'a borrowed name',
];

const LH_NOUNS = [
  'without you',
  'beneath the ice',
  'against the current',
  'in the wrong season',
  'before the ending',
  'across the distance',
  'into the silence',
  'beside the river',
  'through the dark glass',
  'along the edge',
  'after the fire',
  'within the hour',
  'beyond the window',
  'among the ruins',
];

// Progesterone selects adjective phrase (14 options)
const P_ADJS = [
  'waits, quietly,',
  'falls apart',
  'burns slowly',
  'holds its breath',
  'turns to salt',
  'keeps no record',
  'forgets its name',
  'casts no shadow',
  'leaves no trace',
  'refuses to end',
  'carries no weight',
  'does not ask',
  'knows too much',
  'begins again',
];

function buildSentence(eIdx: number, pIdx: number, lhIdx: number): string {
  // If E and LH would land on the same bucket level, offset LH by half a bucket
  let lhI = lhIdx;
  if (eIdx === lhIdx) {
    lhI = (lhIdx + Math.ceil(N / 2)) % N;
  }
  return `${E_NOUNS[eIdx]} ${P_ADJS[pIdx]} ${LH_NOUNS[lhI]}`;
}

// --- Phases layout for lower x-axis ---

const PHASES = [
  { name: 'Menstrual',  start: 1, end: 5  },
  { name: 'Follicular', start: 6, end: 13 },
  { name: 'Fertility',  start: 14, end: 16 },
  { name: 'Luteal',     start: 17, end: 28 },
];

// --- Graph component ---

const GRAPH_W = 520;
const GRAPH_H = 220;
const PAD_L = 16;
const PAD_R = 16;
const PAD_TOP = 32;    // upper x-axis
const PAD_BOT = 36;    // lower x-axis (phase labels)
const INNER_W = GRAPH_W - PAD_L - PAD_R;
const INNER_H = GRAPH_H - PAD_TOP - PAD_BOT;

// How many days to display at once in the viewport
const VIEW_DAYS = 14;

function dayToX(day: number, offset: number) {
  // day is 1-based fractional position in the cycle; offset is the scroll position in days
  const rel = day - offset;
  return PAD_L + (rel / VIEW_DAYS) * INNER_W;
}

function valToY(v: number) {
  // v in [0,1]
  return PAD_TOP + INNER_H - v * INNER_H;
}

function buildPath(
  offsetDay: number,
  key: 'e' | 'p' | 'lh',
): string {
  // Build a smooth path covering a bit extra on each side
  const startDay = offsetDay - 1;
  const endDay   = offsetDay + VIEW_DAYS + 1;
  const steps    = Math.ceil((endDay - startDay) * 4);
  let d = '';
  for (let s = 0; s <= steps; s++) {
    const dayFrac = startDay + (s / steps) * (endDay - startDay);
    const vals = interpolate(dayFrac - 1); // dayFrac is 1-based, interpolate is 0-indexed
    const v = vals[key];
    const x = dayToX(dayFrac, offsetDay);
    const y = valToY(v);
    d += s === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
  }
  return d;
}

interface GraphProps {
  offsetDay: number; // fractional, 1-based, leftmost visible day
  currentDay: number;
}

function CycleGraph({ offsetDay, currentDay }: GraphProps) {
  const pathE   = buildPath(offsetDay, 'e');
  const pathP   = buildPath(offsetDay, 'p');
  const pathLH  = buildPath(offsetDay, 'lh');

  // Current-day vertical line
  const curX = dayToX(currentDay, offsetDay);

  // Upper x-axis tick days
  const upperTicks = [1, 14, 28];

  // Render phase spans on lower axis
  // We need to show whichever cycle repetition is visible
  const lowerAxisItems: { name: string; x1: number; x2: number }[] = [];
  // We may show multiple cycle repetitions
  for (let rep = -1; rep <= 3; rep++) {
    PHASES.forEach(ph => {
      const absStart = ph.start + rep * 28;
      const absEnd   = ph.end   + rep * 28;
      const x1 = dayToX(absStart, offsetDay);
      const x2 = dayToX(absEnd + 1, offsetDay);
      if (x2 > PAD_L && x1 < PAD_L + INNER_W) {
        lowerAxisItems.push({ name: ph.name, x1, x2 });
      }
    });
  }

  // Upper tick marks: find visible ticks across repetitions
  const upperTickItems: { label: number; x: number }[] = [];
  for (let rep = -1; rep <= 3; rep++) {
    upperTicks.forEach(d => {
      const absD = d + rep * 28;
      const x = dayToX(absD, offsetDay);
      if (x >= PAD_L - 2 && x <= PAD_L + INNER_W + 2) {
        upperTickItems.push({ label: d, x });
      }
    });
  }

  return (
    <svg
      width={GRAPH_W}
      height={GRAPH_H}
      style={{ display: 'block', fontFamily: 'monospace' }}
    >
      {/* Background */}
      <rect x={PAD_L} y={PAD_TOP} width={INNER_W} height={INNER_H} fill="#f8f8f8" />

      {/* Upper x-axis */}
      <line x1={PAD_L} y1={PAD_TOP} x2={PAD_L + INNER_W} y2={PAD_TOP} stroke="#ccc" strokeWidth={1} />
      {upperTickItems.map(({ label, x }, i) => (
        <g key={i}>
          <line x1={x} y1={PAD_TOP - 4} x2={x} y2={PAD_TOP} stroke="#888" strokeWidth={1} />
          <text x={x} y={PAD_TOP - 7} textAnchor="middle" fontSize={10} fill="#555">{label}</text>
        </g>
      ))}

      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map(v => (
        <line
          key={v}
          x1={PAD_L} y1={valToY(v)}
          x2={PAD_L + INNER_W} y2={valToY(v)}
          stroke="#e8e8e8" strokeWidth={1}
        />
      ))}

      {/* Clip path */}
      <clipPath id="graph-clip">
        <rect x={PAD_L} y={PAD_TOP} width={INNER_W} height={INNER_H} />
      </clipPath>

      {/* Hormone lines */}
      <path d={pathE}  fill="none" stroke="#c0392b" strokeWidth={1.5} clipPath="url(#graph-clip)" />
      <path d={pathP}  fill="none" stroke="#2980b9" strokeWidth={1.5} clipPath="url(#graph-clip)" />
      <path d={pathLH} fill="none" stroke="#27ae60" strokeWidth={1.5} clipPath="url(#graph-clip)" />

      {/* Current day line */}
      {curX >= PAD_L && curX <= PAD_L + INNER_W && (
        <line x1={curX} y1={PAD_TOP} x2={curX} y2={PAD_TOP + INNER_H} stroke="#333" strokeWidth={1} strokeDasharray="3,3" />
      )}

      {/* Border */}
      <rect x={PAD_L} y={PAD_TOP} width={INNER_W} height={INNER_H} fill="none" stroke="#ccc" strokeWidth={1} />

      {/* Lower x-axis: phase bands */}
      <line x1={PAD_L} y1={PAD_TOP + INNER_H} x2={PAD_L + INNER_W} y2={PAD_TOP + INNER_H} stroke="#ccc" strokeWidth={1} />
      {lowerAxisItems.map(({ name, x1, x2 }, i) => {
        const cx = (Math.max(x1, PAD_L) + Math.min(x2, PAD_L + INNER_W)) / 2;
        const clampedX1 = Math.max(x1, PAD_L);
        return (
          <g key={i}>
            <line x1={clampedX1} y1={PAD_TOP + INNER_H} x2={clampedX1} y2={PAD_TOP + INNER_H + 4} stroke="#aaa" strokeWidth={1} />
            <text x={cx} y={PAD_TOP + INNER_H + 14} textAnchor="middle" fontSize={9} fill="#555">
              {name}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PAD_L + 4}, ${PAD_TOP + 6})`}>
        <line x1={0} y1={0} x2={14} y2={0} stroke="#c0392b" strokeWidth={1.5} />
        <text x={17} y={4} fontSize={9} fill="#c0392b">E</text>
        <line x1={28} y1={0} x2={42} y2={0} stroke="#2980b9" strokeWidth={1.5} />
        <text x={45} y={4} fontSize={9} fill="#2980b9">P</text>
        <line x1={56} y1={0} x2={70} y2={0} stroke="#27ae60" strokeWidth={1.5} />
        <text x={73} y={4} fontSize={9} fill="#27ae60">L</text>
      </g>
    </svg>
  );
}

// --- Main page ---

const DEFAULT_SPEED = 5; // seconds per cycle day

export default function Poetry() {
  // Fractional cycle day, 1-based. Scrolls forward.
  const [dayFrac, setDayFrac] = useState(1.0);
  const [speed, setSpeed]     = useState(DEFAULT_SPEED); // seconds per day
  const [paused, setPaused]   = useState(false);

  const lastTimestampRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    if (lastTimestampRef.current !== null) {
      const elapsed = (ts - lastTimestampRef.current) / 1000; // seconds
      const daysElapsed = elapsed / speed;
      setDayFrac(d => d + daysElapsed);
    }
    lastTimestampRef.current = ts;
    rafRef.current = requestAnimationFrame(tick);
  }, [speed]);

  useEffect(() => {
    if (paused) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimestampRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimestampRef.current = null;
    };
  }, [paused, tick]);

  // Hormone levels at current day
  const vals = interpolate(dayFrac - 1);
  const eIdx   = hormoneLine(vals.e);
  const pIdx   = hormoneLine(vals.p);
  const lhIdx  = hormoneLine(vals.lh);
  const sentence = buildSentence(eIdx, pIdx, lhIdx);

  // Graph offset: keep current day 2/3 of the way through the viewport
  const offsetDay = dayFrac - VIEW_DAYS * (2 / 3);

  const fontBase = 'Georgia, serif';

  const MARKER_COLORS = { E: '#c0392b', P: '#2980b9', L: '#27ae60' };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      padding: '3rem 2.5rem',
      boxSizing: 'border-box',
    }}>
      {/* Title */}
      <h1 style={{
        fontFamily: fontBase,
        fontSize: '1.6rem',
        fontWeight: 400,
        color: '#000',
        marginBottom: '2rem',
      }}>
        Poem clock by D&amp;L
      </h1>

      {/* Main two-column layout */}
      <div style={{
        display: 'flex',
        gap: '3rem',
        alignItems: 'flex-start',
      }}>
        {/* Left: poems */}
        <div style={{ flex: '0 0 auto', minWidth: 0 }}>
          {POEMS.map((line, i) => {
            const markers: string[] = [];
            if (i === eIdx)  markers.push('E');
            if (i === pIdx)  markers.push('P');
            if (i === lhIdx) markers.push('L');
            const isActive = markers.length > 0;

            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                marginBottom: '0.55rem',
                opacity: isActive ? 1 : 0.22,
                transition: 'opacity 0.4s ease',
              }}>
                {/* Markers column — fixed width so text aligns */}
                <span style={{
                  width: '2.2rem',
                  flexShrink: 0,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  letterSpacing: '0.05em',
                }}>
                  {markers.map(m => (
                    <span key={m} style={{ color: MARKER_COLORS[m as keyof typeof MARKER_COLORS] }}>{m}</span>
                  ))}
                </span>
                <span style={{
                  fontFamily: fontBase,
                  fontSize: '1.25rem',
                  color: '#111',
                  lineHeight: 1.65,
                }}>
                  {line}
                </span>
              </div>
            );
          })}

          {/* Composed sentence */}
          <div style={{
            marginTop: '1.75rem',
            fontFamily: fontBase,
            fontSize: '1.05rem',
            color: '#333',
            fontStyle: 'italic',
            paddingLeft: '3rem',
            maxWidth: '480px',
          }}>
            {sentence}
          </div>
        </div>

        {/* Right: graph + controls */}
        <div style={{ flex: '0 0 auto' }}>
          <CycleGraph offsetDay={offsetDay} currentDay={dayFrac} />

          {/* Controls */}
          <div style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#555',
          }}>
            <button
              onClick={() => setPaused(p => !p)}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                background: 'none',
                border: '1px solid #aaa',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
                color: '#333',
              }}
            >
              {paused ? 'play' : 'pause'}
            </button>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              speed
              <input
                type="range"
                min={0.2}
                max={20}
                step={0.1}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
              <span style={{ minWidth: '4em' }}>
                {speed.toFixed(1)}s/day
              </span>
            </label>

            <span style={{ color: '#aaa' }}>
              day {((((dayFrac - 1) % 28) + 28) % 28 + 1).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
