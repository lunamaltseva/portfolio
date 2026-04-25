import { useMemo, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAtomState } from './decay/useAtomState';
import NucleusView from './decay/NucleusView';
import AtomInfo from './decay/AtomInfo';
import AtomControls from './decay/AtomControls';
import { temperatureToSliderPosition } from './decay/nuclearData';

function getBackgroundColor(temperature: number): string {
  const t = temperatureToSliderPosition(temperature);
  const r = Math.round(8 + t * 40);
  const g = Math.round(8 - t * 4);
  const b = Math.round(32 - t * 24);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Decay() {
  const isMobile = useIsMobile();
  const { state, selectIsotope, setTemperature, triggerReaction, clearAtom } =
    useAtomState();

  const bgColor = useMemo(
    () => getBackgroundColor(state.temperature),
    [state.temperature]
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (state.microwaving) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/secret.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [state.microwaving]);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: bgColor,
        minHeight: 'calc(100vh - 120px)',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* 3D Canvas fills the background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <NucleusView
          isotope={state.currentIsotope}
          animation={state.animation}
          isMobile={isMobile}
          temperature={state.temperature}
          microwaving={state.microwaving}
        />
      </div>

      {/* Atom info overlay — top-left */}
      <AtomInfo
        isotope={state.currentIsotope}
        isExcited={state.isExcited}
        isMobile={isMobile}
        microwaveStartedAt={state.microwaveStartedAt}
      />

      {/* Controls overlay — right side (desktop) or bottom (mobile) */}
      <AtomControls
        currentIsotope={state.currentIsotope}
        availableReactions={state.availableReactions}
        allReactions={state.allReactions}
        temperature={state.temperature}
        onReaction={triggerReaction}
        onTemperatureChange={setTemperature}
        onSelectIsotope={selectIsotope}
        onClear={clearAtom}
        isAnimating={state.animation !== null}
        isMobile={isMobile}
        microwaving={state.microwaving}
      />
    </div>
  );
}
