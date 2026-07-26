import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

/* ═══════════════════════════════════════════════════════════════════════════
   What's Wrong With That Graph?  —  a presenter-driven gameshow console.

   Flow:  title → teams → rules → [round 1..5: question → reflection] → winner
   Teams: Team 1 = names A–K, Team 2 = names L–Z. Scores tracked here; the
   presenter decides who answered and whether the answer is accepted.
   Points: rounds 1&2 → 1, rounds 3&4 → 2, round 5 → 3.
   Timer: 45s per round. The marquee lamps start full at 12 o'clock and go dark
   clockwise as the clock runs down; they freeze while a team answers, flash red
   on reject, green on accept.
   ═══════════════════════════════════════════════════════════════════════════ */

const DISPLAY = "'Bungee', 'Impact', system-ui, sans-serif";
const BODY = "'Fredoka', 'Trebuchet MS', system-ui, sans-serif";

const ROUND_TIME = 45; // seconds, fixed for every round
const POINTS_BY_ROUND = [1, 1, 2, 2, 3];
const FLAW_PROMPT = "What's wrong with this graph?";

const C = {
  black: '#000000',
  white: '#ffffff',
  dim: '#9a9a9a',
  faint: '#5a5a5a',
  off: '#242424',
  green: '#007e08',
  red: '#ff0026',
};

/* ─────────────────────────────────────────────────────────────────────────
   ROUND CONTENT — PLACEHOLDER DATA.  Fill these in.
   Each round: a reflection tagline + explanation, and optional custom graphs.
   Drop any JSX (e.g. an inline <svg> or <img>) into `flawedGraph` /
   `betterGraph`; if omitted, a labelled placeholder is shown. The question
   prompt is the same every round ("What's wrong with this graph?").
   ───────────────────────────────────────────────────────────────────────── */
interface RoundContent {
  tagline: string;     // reflection headline
  explanation: string; // reflection body copy
  flawedGraph?: ReactNode;
  betterGraph?: ReactNode;
}

const ROUNDS: RoundContent[] = [
  {
    flawedGraph: '/wwwtg/1b.png',
    betterGraph: '/wwwtg/1g.png',
    tagline: 'Never misrepresent data',
    explanation:
      'When (not if!) that is picked up, it effectively decimates all of your credibility.',
  },
  {
    flawedGraph: '/wwwtg/2b.png',
    betterGraph: '/wwwtg/2g.png',
    tagline: 'Polish your visuals!',
    explanation:
      'Quality visuals give your readers a reason to care.',
  },
  {
    flawedGraph: '/wwwtg/3b.png',
    betterGraph: '/wwwtg/3g.png',
    tagline: 'Some graphs are better for certain purposes',
    explanation:
      'Selecting the right visual enhances overall comprehension and retention.',
  },
  {
    flawedGraph: '/wwwtg/4b.png',
    betterGraph: '/wwwtg/4g.png',
    tagline: 'YOU WILL READ THIS FIRST',
    explanation:
      'And this after that. Visual hierarchy directs attention and thus eases understanding.',
  },
  {
    flawedGraph: '/wwwtg/5b.png',
    betterGraph: '/wwwtg/5g.png',
    tagline: 'Data should tell a story!',
    explanation:
      'Not doing that is data analysis, not data communication: so put core ideas into the titles of your visuals and slides.',
  },
];

// Every image src referenced by a round, so we can preload them all up front
// and avoid graphs popping in late when a round or the compare view appears.
const PRELOAD_SRCS: string[] = ROUNDS.flatMap((r) =>
  [r.flawedGraph, r.betterGraph].filter((g): g is string => typeof g === 'string'),
);

/* ─────────────────────────────────────────────────────────────────────────
   Marquee light frame
   ───────────────────────────────────────────────────────────────────────── */
type LightMode = 'idle' | 'countdown' | 'flash' | 'celebrate' | 'answering' | 'result';

interface BulbPoint { x: number; y: number } // fractions 0..1

// Perimeter points ordered clockwise starting at 12 o'clock (top centre), so a
// countdown can darken lamps from the top and sweep clockwise like a clock hand.
function buildPerimeter(nx: number, ny: number): BulbPoint[] {
  const pts: BulbPoint[] = [];
  for (let i = 0; i < nx; i++) pts.push({ x: i / nx, y: 0 });     // top: L→R
  for (let i = 0; i < ny; i++) pts.push({ x: 1, y: i / ny });     // right: T→B
  for (let i = 0; i < nx; i++) pts.push({ x: 1 - i / nx, y: 1 }); // bottom: R→L
  for (let i = 0; i < ny; i++) pts.push({ x: 0, y: 1 - i / ny }); // left: B→T
  const off = Math.round(nx / 2); // rotate so index 0 lands at ~12 o'clock
  return pts.slice(off).concat(pts.slice(0, off));
}

function LightFrame({
  mode, progress, tick, flashColor, resultColor, isMobile,
}: {
  mode: LightMode;
  progress: number;   // 1 → 0 for countdown
  tick: number;       // animation counter
  flashColor: string;
  resultColor: string; // steady colour for the after-round 'result' mode
  isMobile: boolean;
}) {
  const nx = isMobile ? 7 : 12;
  const ny = isMobile ? 5 : 7;
  const bulbs = useMemo(() => buildPerimeter(nx, ny), [nx, ny]);
  const total = bulbs.length;
  const size = isMobile ? 16 : 26;
  const litCount = Math.ceil(total * Math.max(0, Math.min(1, progress)));
  const offCount = total - litCount;
  const palette = [C.white, C.green, C.red];

  return (
    <div style={{ position: 'fixed', inset: isMobile ? 24 : 48, pointerEvents: 'none', zIndex: 5 }}>
      {bulbs.map((b, i) => {
        let on = false;
        let color = C.white;
        let blink = false;
        let pulse = false;
        if (mode === 'flash') {
          on = true; color = flashColor; blink = true;
        } else if (mode === 'countdown') {
          on = i >= offCount; color = C.white; // darken from 12 o'clock, clockwise
        } else if (mode === 'answering') {
          on = true; color = C.white; pulse = true; // slow breathing while a team answers
        } else if (mode === 'result') {
          on = true; color = resultColor; // steady green/red for the round outcome
        } else if (mode === 'celebrate') {
          on = (i + tick) % 3 !== 0; color = palette[(i + tick) % palette.length];
        } else { // idle: a 2-on / 2-off band that flows around the frame
          on = ((i + tick) % 4) < 2; color = C.white;
        }
        return (
          <span
            key={i}
            className="wwwtg-bulb"
            style={{
              position: 'absolute',
              left: `${b.x * 100}%`,
              top: `${b.y * 100}%`,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: '50%',
              background: on ? color : C.off,
              boxShadow: on
                ? `0 0 ${size * 0.9}px ${size * 0.4}px ${color}bb, inset 0 0 ${size * 0.3}px #fff9`
                : 'inset 0 0 4px #0008',
              animation: blink
                ? 'wwwtg-blink 260ms steps(1) infinite'
                : pulse
                  ? 'wwwtg-slow 1.8s ease-in-out infinite'
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FIFA-style top bar: round (left) · score (centre) · multiplier (right)
   ───────────────────────────────────────────────────────────────────────── */
function TopBar({
  roundIdx, scores, points, answering, isMobile, teamNames,
}: {
  roundIdx: number;
  scores: Record<1 | 2, number>;
  points: number;
  answering: 1 | 2 | null;
  isMobile: boolean;
  teamNames: Record<1 | 2, string>;
}) {
  const teamCell = (team: 1 | 2): CSSProperties => ({
    fontFamily: DISPLAY,
    fontSize: isMobile ? '0.7rem' : '0.9rem',
    letterSpacing: '0.05em',
    color: C.white,
    opacity: answering && answering !== team ? 0.4 : 1,
    textShadow: answering === team ? `0 0 12px ${C.white}` : 'none',
    transition: 'opacity 150ms ease',
  });
  const num = (team: 1 | 2): CSSProperties => ({
    fontFamily: DISPLAY,
    fontSize: isMobile ? '1.5rem' : '2.1rem',
    color: C.white,
    lineHeight: 1,
    textShadow: answering === team ? `0 0 16px ${C.white}` : 'none',
  });
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      width: '100%',
      gap: '0.5rem',
    }}>
      {/* round — top left */}
      <div style={{ justifySelf: 'start', fontFamily: DISPLAY, fontSize: isMobile ? '0.8rem' : '1.05rem', color: C.white, letterSpacing: '0.04em' }}>
        ROUND {roundIdx + 1}<span style={{ color: C.faint }}>/{ROUNDS.length}</span>
      </div>

      {/* score — centred, FIFA style */}
      <div style={{ justifySelf: 'center', display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '1.1rem' }}>
        <span style={teamCell(1)}>{teamNames[1].toUpperCase()}</span>
        <span style={num(1)}>{scores[1]}</span>
        <span style={{ fontFamily: DISPLAY, color: C.faint, fontSize: isMobile ? '1rem' : '1.4rem' }}>–</span>
        <span style={num(2)}>{scores[2]}</span>
        <span style={teamCell(2)}>{teamNames[2].toUpperCase()}</span>
      </div>

      {/* multiplier — top right */}
      <div style={{ justifySelf: 'end', textAlign: 'right' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: isMobile ? '1rem' : '1.4rem', color: C.white }}>×{points}</span>
        <div style={{ fontFamily: BODY, fontSize: '0.6rem', letterSpacing: '0.16em', color: C.faint }}>
          {points === 1 ? 'POINT' : 'POINTS'}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Placeholder graph (square corners)
   ───────────────────────────────────────────────────────────────────────── */
// Renders a round graph: a string is treated as an image src, any other
// ReactNode (e.g. inline <svg>) is rendered as-is, and a missing value falls
// back to the labelled placeholder.
function RoundGraph({
  graph, kind, round, isMobile, maxHeight,
}: {
  graph?: ReactNode;
  kind: 'flawed' | 'better';
  round: number;
  isMobile: boolean;
  maxHeight?: string;
}) {
  if (graph == null) return <GraphPlaceholder kind={kind} round={round} />;
  if (typeof graph === 'string') {
    return (
      <img
        src={graph}
        alt={`${kind} graph for round ${round}`}
        style={{
          display: 'block',
          margin: '0 auto',
          maxWidth: '100%',
          maxHeight: maxHeight ?? (isMobile ? '42vh' : '50vh'),
          objectFit: 'contain',
          background: C.white,
        }}
      />
    );
  }
  return <>{graph}</>;
}

function GraphPlaceholder({ kind, round }: { kind: 'flawed' | 'better'; round: number }) {
  const bars = kind === 'flawed' ? [40, 44, 41, 47, 43] : [22, 41, 33, 58, 47];
  return (
    <div style={{
      border: `2px dashed ${C.faint}`,
      background: 'rgba(255,255,255,0.03)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      minHeight: 200,
      justifyContent: 'center',
    }}>
      <svg viewBox="0 0 200 100" width="100%" height="130" style={{ maxWidth: 340, opacity: 0.55 }} aria-hidden>
        <line x1="20" y1="90" x2="190" y2="90" stroke={C.dim} strokeWidth="1.5" />
        <line x1="20" y1="10" x2="20" y2="90" stroke={C.dim} strokeWidth="1.5" />
        {bars.map((h, i) => (
          <rect key={i} x={30 + i * 32} y={90 - h} width="20" height={h} fill={C.white} opacity="0.65" />
        ))}
      </svg>
      <div style={{ fontFamily: DISPLAY, fontSize: '0.8rem', color: C.white, letterSpacing: '0.04em' }}>
        {kind === 'flawed' ? 'FLAWED' : 'BETTER'} GRAPH · ROUND {round}
      </div>
      <div style={{ fontFamily: BODY, fontSize: '0.75rem', color: C.dim, textAlign: 'center' }}>
        Placeholder — drop the real chart into ROUNDS[{round - 1}].{kind === 'flawed' ? 'flawedGraph' : 'betterGraph'}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Button
   ───────────────────────────────────────────────────────────────────────── */
function Btn({
  children, onClick, tone = 'white', big, style,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'white' | 'green' | 'red' | 'ghost';
  big?: boolean;
  style?: CSSProperties;
}) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    white: { bg: C.white, fg: C.black, bd: C.white },
    green: { bg: C.green, fg: '#00341f', bd: C.green },
    red: { bg: C.red, fg: '#3a0012', bd: C.red },
    ghost: { bg: 'transparent', fg: C.white, bd: C.white },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: DISPLAY,
        fontSize: big ? '1.05rem' : '0.85rem',
        letterSpacing: '0.03em',
        color: t.fg,
        background: t.bg,
        border: `2px solid ${t.bd}`,
        borderRadius: 999,
        padding: big ? '0.95rem 2.2rem' : '0.7rem 1.4rem',
        cursor: 'pointer',
        transition: 'transform 120ms ease',
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      {children}
    </button>
  );
}

// Renders text with a line break after every sentence (period).
function Sentences({ text }: { text: string }) {
  const parts = text.match(/[^.]+\./g) ?? [text];
  return (
    <>
      {parts.map((s, i) => (
        <span key={i} style={{ display: 'block' }}>{s.trim()}</span>
      ))}
    </>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Main
   ═════════════════════════════════════════════════════════════════════════ */
type Phase = 'title' | 'teams' | 'rules' | 'question' | 'reflection' | 'winner';

export default function Wwwtg() {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>('title');
  const [roundIdx, setRoundIdx] = useState(0);
  const [scores, setScores] = useState<Record<1 | 2, number>>({ 1: 0, 2: 0 });
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [answering, setAnswering] = useState<1 | 2 | null>(null);
  const [flash, setFlash] = useState<null | 'red' | 'green' | 'timeup'>(null);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [tick, setTick] = useState(0);
  const [roundResult, setRoundResult] = useState<'won' | 'lost' | null>(null);
  const [compare, setCompare] = useState(false); // reflection: show bad vs good side by side
  const [teamNames, setTeamNames] = useState<Record<1 | 2, string>>({ 1: 'Team 1', 2: 'Team 2' });
  const timeupHandled = useRef(false); // guards the once-per-round time-up sequence

  const points = POINTS_BY_ROUND[roundIdx];

  // Preload every round graph once on mount so images are already cached by the
  // time each round (and the compare view) is shown — no late pop-in.
  useEffect(() => {
    PRELOAD_SRCS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Always-on animation tick for the flowing idle / celebrate light patterns.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 180);
    return () => clearInterval(id);
  }, []);

  // Countdown: runs only in the question phase, while nobody is answering, no
  // flash is playing, and the points announcement isn't up.
  const timerRunning = phase === 'question' && answering === null && !flash && !showAnnounce;
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, +(t - 0.1).toFixed(2))), 100);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToRound = useCallback((i: number) => {
    timeupHandled.current = false;
    setRoundIdx(i);
    setTimeLeft(ROUND_TIME);
    setAnswering(null);
    setFlash(null);
    setRoundResult(null);
    setCompare(false);
    setShowAnnounce(i === 2 || i === 4); // rounds 3 & 5: announce the points bump
    setPhase('question');
  }, []);

  // Time's up → flash red, then advance to reflection with no points. State
  // updates are deferred into timers (not the synchronous effect body) and a
  // ref guards re-entry, so the pending advance is never torn down when `flash`
  // changes. `flash` is intentionally not a dependency here.
  useEffect(() => {
    if (phase !== 'question' || showAnnounce || timeLeft > 0 || timeupHandled.current) return;
    timeupHandled.current = true;
    const t1 = setTimeout(() => setFlash('timeup'), 0);
    const t2 = setTimeout(() => {
      setFlash(null);
      setAnswering(null);
      setRoundResult('lost');
      setPhase('reflection');
    }, 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, showAnnounce, timeLeft]);

  const acceptAnswer = () => {
    if (!answering) return;
    const team = answering;
    setScores((s) => ({ ...s, [team]: s[team] + points }));
    setFlash('green');
    setTimeout(() => {
      setFlash(null);
      setAnswering(null);
      setRoundResult('won');
      setPhase('reflection');
    }, 1100);
  };

  const rejectAnswer = () => {
    setFlash('red');
    setAnswering(null); // clock resumes once the flash clears
    setTimeout(() => setFlash(null), 900);
  };

  const nextRound = () => {
    if (roundIdx < ROUNDS.length - 1) goToRound(roundIdx + 1);
    else setPhase('winner');
  };

  // Light mode + colour for the current moment.
  const flashColor = flash === 'green' ? C.green : C.red;
  const resultColor = roundResult === 'lost' ? C.red : C.green;
  const lightMode: LightMode = flash
    ? 'flash'
    : phase === 'winner'
      ? 'celebrate'
      : phase === 'reflection'
        ? 'result'
        : phase === 'question' && !showAnnounce && answering !== null
          ? 'answering'
          : phase === 'question' && !showAnnounce
            ? 'countdown'
            : 'idle';

  const round = ROUNDS[roundIdx];

  const contentWrap: CSSProperties = {
    position: 'fixed',
    inset: 0,
    padding: isMobile ? '58px 26px' : '84px 96px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  };

  // Full-height playfield: top bar, centred middle, controls pinned to bottom.
  const playfield = (middle: ReactNode, controls: ReactNode) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', gap: '1.25rem', minHeight: 0 }}>
      <TopBar roundIdx={roundIdx} scores={scores} points={points} answering={answering} isMobile={isMobile} teamNames={teamNames} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ width: '100%', maxWidth: 760 }}>{middle}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        {controls}
      </div>
    </div>
  );

  /* ── phase renderers ── */
  const renderTitle = () => (
    <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 900 }}>
      <div style={{ fontFamily: BODY, color: C.dim, letterSpacing: '0.35em', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        EVERYONE'S FAVORITE GAMESHOW
      </div>
      <h1 style={{
        fontFamily: DISPLAY,
        fontSize: isMobile ? '2.6rem' : '5rem',
        lineHeight: 1.02,
        margin: 0,
        color: C.white,
        textShadow: `0 0 22px ${C.white}88`,
      }}>
        What's Wrong<br />With That Graph?
      </h1>
      <div style={{ marginTop: '2.4rem' }}>
        <Btn onClick={() => setPhase('teams')} big>▶  START THE SHOW</Btn>
      </div>
    </div>
  );

  const renderTeams = () => {
    const letterTile = (ch: string) => (
      <span key={ch} style={{
        fontFamily: DISPLAY,
        fontSize: isMobile ? '1rem' : '1.35rem',
        width: isMobile ? 38 : 52,
        height: isMobile ? 38 : 52,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${C.white}`,
        color: C.white,
        background: C.black,
      }}>
        {ch}
      </span>
    );
    const team1 = 'ABCDEFGHIJK'.split('');
    const team2 = 'LMNOPQRSTUVWXYZ'.split('');
    const nameField = (team: 1 | 2) => (
      <input
        value={teamNames[team]}
        onChange={(e) => setTeamNames((n) => ({ ...n, [team]: e.target.value }))}
        maxLength={24}
        aria-label={`Team ${team} name`}
        spellCheck={false}
        style={{
          fontFamily: DISPLAY,
          color: C.white,
          fontSize: isMobile ? '1.3rem' : '1.7rem',
          letterSpacing: '0.05em',
          textAlign: 'center',
          marginBottom: '1rem',
          background: 'transparent',
          border: 'none',
          borderBottom: `2px solid ${C.faint}`,
          padding: '0.2rem 0.4rem',
          maxWidth: '100%',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = C.white)}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = C.faint)}
      />
    );
    return (
      <div style={{ margin: 'auto', maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: DISPLAY, color: C.white, fontSize: isMobile ? '1.9rem' : '2.8rem', margin: '0 0 1.25rem', textShadow: `0 0 16px ${C.white}66` }}>
          The Teams
        </h2>
        <p style={{ fontFamily: BODY, color: C.white, fontSize: isMobile ? '1rem' : '1.2rem', lineHeight: 1.6, margin: '0 auto 2.5rem', maxWidth: 620, textAlign: 'left' }}>
          <Sentences text="There are two teams. They are decided based on the first letter of your name." />
        </p>

        <div style={{ marginBottom: '2.25rem' }}>
          <div>{nameField(1)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.4rem' : '0.6rem', justifyContent: 'center' }}>
            {team1.map(letterTile)}
          </div>
        </div>

        <div style={{ marginBottom: '2.75rem' }}>
          <div>{nameField(2)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.4rem' : '0.6rem', justifyContent: 'center' }}>
            {team2.map(letterTile)}
          </div>
        </div>

        <Btn onClick={() => setPhase('rules')} big>NEXT ▶</Btn>
      </div>
    );
  };

  const renderRules = () => (
    <div style={{ margin: 'auto', maxWidth: 720, width: '100%', textAlign: 'center' }}>
      <h2 style={{ fontFamily: DISPLAY, color: C.white, fontSize: isMobile ? '1.9rem' : '2.8rem', margin: '0 0 1.5rem', textShadow: `0 0 16px ${C.white}66` }}>
        The Rules
      </h2>
      <p style={{ fontFamily: BODY, color: C.white, fontSize: isMobile ? '1.05rem' : '1.3rem', lineHeight: 1.7, margin: '0 auto 2.75rem', maxWidth: 640, textAlign: 'left' }}>
        <Sentences text="Each round, a graph with an obvious flaw is presented. The first person to buzz in with an answer wins their team points. The difficulty and point rewards increase over time. The team with the most points wins." />
      </p>
      <Btn onClick={() => goToRound(0)} big>LET'S PLAY ▶</Btn>
    </div>
  );

  const renderQuestion = () => playfield(
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontFamily: DISPLAY, color: C.white, fontSize: isMobile ? '1.4rem' : '2rem', margin: '0 0 1.25rem', textShadow: `0 0 14px ${C.white}55` }}>
        {FLAW_PROMPT}
      </h2>
      <RoundGraph graph={round.flawedGraph} kind="flawed" round={roundIdx + 1} isMobile={isMobile} />

      <div style={{ fontFamily: BODY, color: C.dim, fontSize: '0.8rem', minHeight: '1.2rem', marginTop: '0.9rem' }}>
        {flash === 'timeup' ? "Time's up!" : ''}
      </div>
    </div>,
    answering === null ? (
      <>
        <Btn onClick={() => setAnswering(1)} tone="ghost">{teamNames[1].toUpperCase()} BUZZED</Btn>
        <Btn onClick={() => setAnswering(2)} tone="ghost">{teamNames[2].toUpperCase()} BUZZED</Btn>
      </>
    ) : (
      <>
        <Btn onClick={acceptAnswer} tone="green">ACCEPT</Btn>
        <Btn onClick={rejectAnswer} tone="red">REJECT</Btn>
      </>
    ),
  );

  const graphCaption = (color: string): CSSProperties => ({
    fontFamily: DISPLAY,
    fontSize: isMobile ? '0.8rem' : '0.95rem',
    letterSpacing: '0.08em',
    color,
    textAlign: 'center',
    marginTop: '0.6rem',
  });

  const renderReflection = () => playfield(
    <div style={{ maxWidth: compare ? 1100 : undefined, margin: '0 auto' }}>
      <h2 style={{ fontFamily: DISPLAY, color: C.white, fontSize: isMobile ? '1.5rem' : '2.1rem', margin: '0 0 0.75rem', textShadow: `0 0 14px ${C.white}55` }}>
        {round.tagline}
      </h2>
      <p style={{ fontFamily: BODY, color: C.dim, fontSize: isMobile ? '0.95rem' : '1.05rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
        {round.explanation}
      </p>
      {compare ? (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.25rem' : '1.75rem', alignItems: 'flex-start' }}>
          <figure style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <RoundGraph graph={round.flawedGraph} kind="flawed" round={roundIdx + 1} isMobile={isMobile} maxHeight={isMobile ? '32vh' : '46vh'} />
          </figure>
          <figure style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <RoundGraph graph={round.betterGraph} kind="better" round={roundIdx + 1} isMobile={isMobile} maxHeight={isMobile ? '32vh' : '46vh'} />
          </figure>
        </div>
      ) : (
        <RoundGraph graph={round.betterGraph} kind="better" round={roundIdx + 1} isMobile={isMobile} />
      )}
    </div>,
    <>
      <Btn onClick={() => setCompare((c) => !c)} tone="ghost">
        {compare ? 'COMPARE ◧' : 'COMPARE ◧'}
      </Btn>
      <Btn onClick={nextRound} big>
        {roundIdx < ROUNDS.length - 1 ? 'NEXT ROUND ▶' : 'REVEAL THE WINNER ▶'}
      </Btn>
    </>,
  );

  const renderWinner = () => {
    const winner = scores[1] === scores[2] ? 0 : scores[1] > scores[2] ? 1 : 2;
    return (
      <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 800 }}>
        <div style={{ fontFamily: BODY, color: C.dim, letterSpacing: '0.3em', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          FINAL RESULTS
        </div>
        <h1 style={{
          fontFamily: DISPLAY,
          fontSize: isMobile ? '2.4rem' : '4rem',
          margin: 0,
          color: C.white,
          textShadow: `0 0 24px ${winner === 0 ? C.white : C.green}cc`,
        }}>
          {winner === 0 ? "It's a tie!" : `${teamNames[winner as 1 | 2]} wins!`}
        </h1>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
          {([1, 2] as const).map((team) => (
            <div key={team} style={{
              background: C.black,
              border: `2px solid ${winner === team ? C.green : C.white}`,
              padding: '1.4rem 2rem', minWidth: 160,
              transform: winner === team ? 'scale(1.06)' : 'none',
              boxShadow: winner === team ? `0 0 30px ${C.green}88` : 'none',
            }}>
              <div style={{ fontFamily: BODY, color: C.white, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {teamNames[team]}
              </div>
              <div style={{ fontFamily: DISPLAY, color: C.white, fontSize: '3rem', lineHeight: 1.1 }}>{scores[team]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.black, overflow: 'hidden' }}>
      <style>{`
        @keyframes wwwtg-blink { 0% { opacity: 1; } 50% { opacity: 0.12; } 100% { opacity: 1; } }
        @keyframes wwwtg-pop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes wwwtg-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.32; } }
        .wwwtg-bulb { transition: background 160ms ease, box-shadow 160ms ease; }
      `}</style>

      <LightFrame mode={lightMode} progress={timeLeft / ROUND_TIME} tick={tick} flashColor={flashColor} resultColor={resultColor} isMobile={isMobile} />

      <div style={contentWrap}>
        {phase === 'title' && renderTitle()}
        {phase === 'teams' && renderTeams()}
        {phase === 'rules' && renderRules()}
        {phase === 'question' && renderQuestion()}
        {phase === 'reflection' && renderReflection()}
        {phase === 'winner' && renderWinner()}
      </div>

      {/* Points-increase announcement (rounds 3 & 5) */}
      {showAnnounce && phase === 'question' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ animation: 'wwwtg-pop 300ms ease both' }}>
            <div style={{ fontFamily: DISPLAY, color: C.white, fontSize: isMobile ? '1.6rem' : '2.8rem', textShadow: `0 0 22px ${C.white}aa`, maxWidth: 700, lineHeight: 1.15 }}>
              The Multiplier Has Increased to {points}x
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Btn onClick={() => setShowAnnounce(false)} big>START ROUND {roundIdx + 1} ▶</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
