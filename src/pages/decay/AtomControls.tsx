import { useMemo, useCallback } from 'react';
import type { Reaction, ReactionType, Isotope } from './nuclearData';
import { STARTER_ISOTOPES, temperatureToSliderPosition } from './nuclearData';

interface AtomControlsProps {
  currentIsotope: Isotope | null;
  availableReactions: Reaction[];
  allReactions: Reaction[];
  temperature: number;
  onReaction: (type: ReactionType) => void;
  onTemperatureChange: (t: number) => void;
  onSelectIsotope: (id: string) => void;
  onClear: () => void;
  isAnimating: boolean;
  isMobile: boolean;
  microwaving: boolean;
}

const REACTION_ICONS: Record<ReactionType, string | null> = {
  alpha: 'α',
  beta: 'β⁻',
  gamma: 'γ',
  'neutron-collision': 'n',
  'deuterium-collision': 'D',
  fission: '⚛',
  microwave: null, // uses SVG
};

function MicrowaveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <rect x="4" y="6" width="11" height="10" rx="1" fill="none" />
      <circle cx="18" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M7 16 C7 12, 8 10, 9 9" />
      <path d="M10 16 C10 13, 11 11, 12 10" />
    </svg>
  );
}

const REACTION_ORDER: ReactionType[] = [
  'alpha',
  'beta',
  'gamma',
  'neutron-collision',
  'deuterium-collision',
  'fission',
  'microwave',
];

function formatTemperature(t: number): string {
  if (t === 0) return '0 K';
  if (t < 1000) return `${Math.round(t)} K`;
  if (t < 1_000_000) return `${(t / 1000).toFixed(1)}k K`;
  if (t < 1_000_000_000) return `${(t / 1_000_000).toFixed(1)} MK`;
  return `${(t / 1_000_000_000).toFixed(1)} GK`;
}

// Logarithmic slider: position [0,1] -> temperature [0, 150M]
function positionToTemperature(pos: number): number {
  if (pos <= 0) return 0;
  // log scale from 100 to 150,000,000
  const minLog = 2; // log10(100)
  const maxLog = Math.log10(150_000_000);
  const logVal = minLog + pos * (maxLog - minLog);
  return Math.round(Math.pow(10, logVal));
}

const temperatureToPosition = temperatureToSliderPosition;

// Temperature gradient color
function getTemperatureColor(pos: number): string {
  if (pos < 0.3) {
    const t = pos / 0.3;
    const r = Math.round(50 + t * 50);
    const g = Math.round(100 + t * 50);
    const b = Math.round(200 - t * 50);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (pos < 0.7) {
    const t = (pos - 0.3) / 0.4;
    const r = Math.round(100 + t * 155);
    const g = Math.round(150 - t * 50);
    const b = Math.round(150 - t * 100);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (pos - 0.7) / 0.3;
    const r = 255;
    const g = Math.round(100 + t * 155);
    const b = Math.round(50 + t * 205);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export default function AtomControls({
  currentIsotope,
  availableReactions,
  allReactions,
  temperature,
  onReaction,
  onTemperatureChange,
  onSelectIsotope,
  onClear,
  isAnimating,
  isMobile,
  microwaving,
}: AtomControlsProps) {
  const availableTypes = useMemo(
    () => new Set(availableReactions.map((r) => r.type)),
    [availableReactions]
  );

  const allTypes = useMemo(
    () => new Set(allReactions.map((r) => r.type)),
    [allReactions]
  );

  const reactionDescriptions = useMemo(() => {
    const map = new Map<ReactionType, string>();
    for (const r of allReactions) {
      map.set(r.type, r.description);
    }
    return map;
  }, [allReactions]);

  const sliderPos = temperatureToPosition(temperature);
  const tempColor = getTemperatureColor(sliderPos);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pos = parseFloat(e.target.value);
      onTemperatureChange(positionToTemperature(pos));
    },
    [onTemperatureChange]
  );

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'rgba(20, 20, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #333',
        borderRadius: '1rem 1rem 0 0',
        padding: '16px',
        maxHeight: '45vh',
        overflowY: 'auto',
      }
    : {
        position: 'absolute',
        top: '50%',
        right: 24,
        transform: 'translateY(-50%)',
        zIndex: 10,
        backgroundColor: 'rgba(20, 20, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #333',
        borderRadius: '0.75rem',
        padding: '20px',
        width: '240px',
      };

  const buttonBase: React.CSSProperties = {
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'var(--font-primary), sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    textAlign: 'left',
    width: '100%',
  };

  const disabledStyle: React.CSSProperties = {
    opacity: 0.25,
    cursor: 'not-allowed',
    border: '1px solid #2a2a2a',
  };

  const activeStyle: React.CSSProperties = {
    border: '1px solid #e74c3c',
    background: 'rgba(231, 76, 60, 0.15)',
    boxShadow: '0 0 8px rgba(231, 76, 60, 0.2)',
  };

  return (
    <div style={panelStyle}>
      {/* Isotope selector */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
            fontFamily: 'var(--font-primary), sans-serif',
          }}
        >
          Select Atom
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STARTER_ISOTOPES.map((iso) => (
            <button
              key={iso.id}
              onClick={() => onSelectIsotope(iso.id)}
              disabled={isAnimating}
              style={{
                ...buttonBase,
                width: 'auto',
                flex: '1',
                textAlign: 'center',
                padding: '8px 10px',
                ...(currentIsotope?.id === iso.id
                  ? {
                      border: '1px solid #fff',
                      background: 'rgba(255,255,255,0.12)',
                    }
                  : {}),
                ...(isAnimating ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
            >
              {iso.id}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, #444, transparent)',
          margin: '12px 0',
        }}
      />

      {/* Reaction buttons */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
            fontFamily: 'var(--font-primary), sans-serif',
          }}
        >
          Reactions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REACTION_ORDER.map((type) => {
            const isAvailable = availableTypes.has(type);
            const exists = allTypes.has(type);
            const isMicrowave = type === 'microwave';
            const gammaAvailable = availableTypes.has('gamma');

            // When gamma is available, force user to perform gamma first
            // (only gamma and microwave-toggle are allowed)
            const gammaBlocked = gammaAvailable && type !== 'gamma' && !isMicrowave;

            // Microwave: disabled only when animating (not by microwaving itself since it's a toggle)
            // Other reactions: disabled when microwaving, animating, not available, or gamma-blocked
            const disabled = isMicrowave
              ? !isAvailable || isAnimating || !currentIsotope
              : !isAvailable || isAnimating || !currentIsotope || microwaving || gammaBlocked;

            const description = reactionDescriptions.get(type);

            if (!exists && !currentIsotope) return null;

            const microwaveActiveStyle: React.CSSProperties = isMicrowave && microwaving
              ? {
                  border: '1px solid #f39c12',
                  background: 'rgba(243, 156, 18, 0.25)',
                  boxShadow: '0 0 12px rgba(243, 156, 18, 0.3)',
                }
              : {};

            return (
              <button
                key={type}
                onClick={() => !disabled && onReaction(type)}
                disabled={disabled}
                style={{
                  ...buttonBase,
                  ...(disabled && !(isMicrowave && microwaving) ? disabledStyle : activeStyle),
                  ...microwaveActiveStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                title={description || type}
              >
                <span
                  style={{
                    fontSize: '16px',
                    width: '24px',
                    textAlign: 'center',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isMicrowave ? <MicrowaveIcon /> : REACTION_ICONS[type]}
                </span>
                <span style={{ flexGrow: 1 }}>
                  {isMicrowave
                    ? (microwaving ? 'Stop Microwave' : 'Microwave')
                    : type === 'neutron-collision'
                      ? 'Neutron'
                      : type === 'deuterium-collision'
                        ? 'Deuterium'
                        : type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                {exists && isAvailable && !isMicrowave && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#2ecc71',
                      flexShrink: 0,
                    }}
                  />
                )}
                {isMicrowave && microwaving && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#f39c12',
                      flexShrink: 0,
                      animation: 'pulse 0.5s ease-in-out infinite alternate',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, #444, transparent)',
          margin: '12px 0',
        }}
      />

      {/* Temperature slider */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
            fontFamily: 'var(--font-primary), sans-serif',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Temperature</span>
          <span style={{ color: tempColor, fontWeight: 'bold' }}>
            {formatTemperature(temperature)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={sliderPos}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '6px',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, #334, ${tempColor})`,
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#555',
            marginTop: '4px',
            fontFamily: 'var(--font-primary), sans-serif',
          }}
        >
          <span>0 K</span>
          <span>150 MK</span>
        </div>
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        disabled={isAnimating || !currentIsotope}
        style={{
          ...buttonBase,
          textAlign: 'center',
          border: '1px solid #555',
          color: '#aaa',
          ...(isAnimating || !currentIsotope
            ? { opacity: 0.3, cursor: 'not-allowed' }
            : {}),
        }}
      >
        Clear Atom
      </button>
    </div>
  );
}
