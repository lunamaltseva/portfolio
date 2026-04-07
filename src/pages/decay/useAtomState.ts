import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Isotope, Reaction, ReactionType, Particle } from './nuclearData';
import {
  getAvailableReactions,
  getAllReactions,
  getIsotopeEntry,
  STARTER_ISOTOPES,
  DEUTERIUM_PARTICLE,
  NEUTRON_PARTICLE,
} from './nuclearData';
import { clearLayoutCache } from './nucleonLayout';

export type AnimationPhase = 'approaching' | 'reacting' | 'departing' | 'done';

export interface AnimationState {
  type: ReactionType;
  ejectiles: Particle[];
  incomingParticle: Particle | null;
  phase: AnimationPhase;
  startedAt: number;
  productName: string;
  energyReleased?: string;
}

export interface AtomState {
  currentIsotope: Isotope | null;
  isExcited: boolean;
  temperature: number;
  availableReactions: Reaction[];
  allReactions: Reaction[];
  animation: AnimationState | null;
  microwaving: boolean;
}

const PHASE_DURATIONS: Record<AnimationPhase, number> = {
  approaching: 2000,
  reacting: 600,
  departing: 3500,
  done: 0,
};

export function useAtomState() {
  const [currentIsotope, setCurrentIsotope] = useState<Isotope | null>(null);
  const [isExcited, setIsExcited] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [animation, setAnimation] = useState<AnimationState | null>(null);
  const [microwaving, setMicrowaving] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const availableReactions = useMemo(() => {
    if (!currentIsotope) return [];
    return getAvailableReactions(currentIsotope.id, temperature, isExcited);
  }, [currentIsotope, temperature, isExcited]);

  const allReactions = useMemo(() => {
    if (!currentIsotope) return [];
    return getAllReactions(currentIsotope.id);
  }, [currentIsotope]);

  const advancePhase = useCallback(
    (
      currentPhase: AnimationPhase,
      reaction: Reaction,
      animationData: Omit<AnimationState, 'phase' | 'startedAt'>
    ) => {
      const phases: AnimationPhase[] = ['approaching', 'reacting', 'departing', 'done'];
      const currentIndex = phases.indexOf(currentPhase);
      const nextPhase = phases[currentIndex + 1];

      if (!nextPhase || nextPhase === 'done') {
        setAnimation(null);
        return;
      }

      if (nextPhase === 'reacting') {
        // Apply the reaction product
        const entry = getIsotopeEntry(reaction.productId);
        if (entry) {
          setCurrentIsotope(entry.isotope);
          // After a reaction, the product might be in an excited state
          // (except for beta decay products and fission products which are typically ground state for simplicity)
          if (reaction.type === 'neutron-collision' || reaction.type === 'fission') {
            setIsExcited(true);
          } else {
            setIsExcited(false);
          }
        }
      }

      setAnimation({
        ...animationData,
        phase: nextPhase,
        startedAt: performance.now(),
      });

      timeoutRef.current = setTimeout(() => {
        advancePhase(nextPhase, reaction, animationData);
      }, PHASE_DURATIONS[nextPhase]);
    },
    []
  );

  const triggerReaction = useCallback(
    (type: ReactionType) => {
      if (type === 'microwave' && currentIsotope) {
        // Toggle: if already microwaving, turn off; otherwise turn on
        setMicrowaving((prev) => !prev);
        return;
      }
      // Block all other reactions while microwaving
      if (microwaving) return;
      if (animation) return;
      if (!currentIsotope) return;

      const reaction = availableReactions.find((r) => r.type === type);
      if (!reaction) return;

      // Determine incoming particle for approach animation
      let incomingParticle: Particle | null = null;
      if (type === 'neutron-collision' || type === 'fission') {
        incomingParticle = NEUTRON_PARTICLE;
      } else if (type === 'deuterium-collision') {
        incomingParticle = DEUTERIUM_PARTICLE;
      }

      const animationData = {
        type,
        ejectiles: reaction.ejectiles,
        incomingParticle,
        productName: reaction.description,
        energyReleased: type === 'fission' ? reaction.energyReleased : undefined,
      };

      const needsApproach = incomingParticle !== null;
      const startPhase: AnimationPhase = needsApproach ? 'approaching' : 'reacting';

      setAnimation({
        ...animationData,
        phase: startPhase,
        startedAt: performance.now(),
      });

      if (startPhase === 'reacting') {
        // Apply product immediately for non-approach reactions
        const entry = getIsotopeEntry(reaction.productId);
        if (entry) {
          setCurrentIsotope(entry.isotope);
          if (type === 'gamma') {
            setIsExcited(false);
          } else {
            setIsExcited(false);
          }
        }
      }

      timeoutRef.current = setTimeout(() => {
        advancePhase(startPhase, reaction, animationData);
      }, PHASE_DURATIONS[startPhase]);
    },
    [animation, currentIsotope, availableReactions, advancePhase, microwaving]
  );

  const selectIsotope = useCallback((id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAnimation(null);
    setMicrowaving(false);

    const entry = getIsotopeEntry(id);
    if (entry) {
      setCurrentIsotope(entry.isotope);
      setIsExcited(false);
    }
  }, []);

  const clearAtom = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAnimation(null);
    setMicrowaving(false);
    setCurrentIsotope(null);
    setIsExcited(false);
    clearLayoutCache();
  }, []);

  const state: AtomState = {
    currentIsotope,
    isExcited,
    temperature,
    availableReactions,
    allReactions,
    animation,
    microwaving,
  };

  return {
    state,
    selectIsotope,
    setTemperature,
    triggerReaction,
    clearAtom,
    starterIsotopes: STARTER_ISOTOPES,
  };
}
