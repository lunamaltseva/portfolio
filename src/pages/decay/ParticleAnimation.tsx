import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh, MeshStandardMaterial, PointLight } from 'three';
import { Vector3, Color } from 'three';
import type { AnimationState } from './useAtomState';
import type { Particle } from './nuclearData';

interface ParticleAnimationProps {
  animation: AnimationState;
}

interface AnimatedParticleProps {
  particle: Particle;
  direction: Vector3;
  phase: string;
  startedAt: number;
  index: number;
  isBetaIncoming?: boolean;
}

const DEPART_DURATION = 3.0;
const DEPART_DISTANCE = 18;

function AnimatedParticle({
  particle,
  direction,
  phase,
  startedAt,
  index,
  isBetaIncoming,
}: AnimatedParticleProps) {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const incomingStart = useMemo(
    () => direction.clone().multiplyScalar(15),
    [direction]
  );

  useFrame(() => {
    if (!meshRef.current) return;
    elapsed.current = (performance.now() - startedAt) / 1000;

    if (isBetaIncoming && phase === 'reacting') {
      // Neutrino approaches the nucleus during the reacting phase
      const t = Math.min(elapsed.current / 0.4, 1);
      const eased = t * t;
      meshRef.current.position.lerpVectors(
        incomingStart,
        new Vector3(0, 0, 0),
        eased
      );
      meshRef.current.visible = true;
      meshRef.current.scale.setScalar(1);

      const mat = meshRef.current.material as MeshStandardMaterial;
      if (mat) {
        mat.transparent = true;
        mat.opacity = 1;
      }
    } else if (isBetaIncoming && phase === 'departing') {
      // Neutrino has arrived — hide it
      meshRef.current.visible = false;
    } else if (!isBetaIncoming && phase === 'reacting') {
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.scale.setScalar(
        1 + Math.sin(elapsed.current * 20) * 0.3
      );
      meshRef.current.visible = true;
    } else if (!isBetaIncoming && phase === 'departing') {
      const t = Math.min(elapsed.current / DEPART_DURATION, 1);
      // Smooth ease-in-out so particles drift away gently
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const targetPos = direction.clone().multiplyScalar(DEPART_DISTANCE);
      meshRef.current.position.lerpVectors(
        new Vector3(0, 0, 0),
        targetPos,
        eased
      );
      meshRef.current.scale.setScalar(1);

      const mat = meshRef.current.material as MeshStandardMaterial;
      if (mat) {
        mat.transparent = true;
        mat.opacity = 1 - t * 0.9;
      }
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  const isGamma = particle.symbol === 'γ';
  const showLabel =
    (isBetaIncoming && phase === 'reacting') ||
    (!isBetaIncoming && phase === 'departing');

  return (
    <mesh ref={meshRef} visible={false}>
      {isGamma ? (
        <torusGeometry
          args={[particle.radius * 2, particle.radius * 0.3, 8, 24]}
        />
      ) : (
        <sphereGeometry args={[particle.radius, 16, 16]} />
      )}
      <meshStandardMaterial
        color={new Color(particle.color)}
        emissive={new Color(particle.color)}
        emissiveIntensity={0.5}
        transparent
        roughness={0.3}
      />
      {showLabel && (
        <Html
          center
          style={{
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'var(--font-primary), sans-serif',
            background: 'rgba(0,0,0,0.75)',
            padding: '2px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            transform: `translateY(${-22 - index * 6}px)`,
          }}
        >
          {particle.symbol}
        </Html>
      )}
    </mesh>
  );
}

// Incoming neutron/deuterium approaching the nucleus — slower, more visible
function IncomingParticle({
  particle,
  phase,
  startedAt,
}: {
  particle: Particle;
  phase: string;
  startedAt: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const startPos = useMemo(() => new Vector3(14, 6, 10), []);
  const trailRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - startedAt) / 1000;

    if (phase === 'approaching') {
      // Slower approach: 1.8 seconds, mostly linear with slight ease-in at end
      const t = Math.min(elapsed / 1.8, 1);
      // Smooth ease: mostly linear, gentle acceleration at end
      const eased = t < 0.7 ? t * 0.8 : 0.56 + (t - 0.7) / 0.3 * 0.44;
      const clampedEased = Math.min(eased, 1);

      meshRef.current.position.lerpVectors(
        startPos,
        new Vector3(0, 0, 0),
        clampedEased
      );
      meshRef.current.visible = true;

      // Gentle pulsing
      const scale = 1 + 0.15 * Math.sin(elapsed * 8);
      meshRef.current.scale.setScalar(scale);

      // Trail ghost
      if (trailRef.current) {
        const trailT = Math.max(0, t - 0.08);
        const trailEased =
          trailT < 0.7
            ? trailT * 0.8
            : 0.56 + (trailT - 0.7) / 0.3 * 0.44;
        trailRef.current.position.lerpVectors(
          startPos,
          new Vector3(0, 0, 0),
          Math.min(trailEased, 1)
        );
        trailRef.current.visible = t > 0.08;
        const mat = trailRef.current.material as MeshStandardMaterial;
        if (mat) {
          mat.transparent = true;
          mat.opacity = 0.3 * (1 - t);
        }
      }
    } else {
      meshRef.current.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
    }
  });

  const displayRadius = Math.max(particle.radius * 1.8, 0.3);

  return (
    <group>
      <mesh ref={trailRef} visible={false}>
        <sphereGeometry args={[displayRadius * 0.7, 12, 12]} />
        <meshStandardMaterial
          color={new Color(particle.color)}
          emissive={new Color(particle.color)}
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[displayRadius, 16, 16]} />
        <meshStandardMaterial
          color={new Color(particle.color)}
          emissive={new Color(particle.color)}
          emissiveIntensity={0.8}
        />
        {phase === 'approaching' && (
          <Html
            center
            style={{
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-primary), sans-serif',
              background: 'rgba(0,0,0,0.8)',
              padding: '3px 10px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'translateY(-28px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {particle.symbol}
          </Html>
        )}
      </mesh>
    </group>
  );
}

function ReactionFlash({
  phase,
  startedAt,
}: {
  phase: string;
  startedAt: number;
}) {
  const lightRef = useRef<PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const elapsed = (performance.now() - startedAt) / 1000;

    if (phase === 'reacting') {
      const intensity = Math.max(0, 8 * (1 - elapsed / 0.5));
      lightRef.current.intensity = intensity;
      lightRef.current.visible = true;
    } else {
      lightRef.current.intensity = 0;
      lightRef.current.visible = false;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      color="#ffffff"
      intensity={0}
      distance={25}
    />
  );
}

export default function ParticleAnimation({
  animation,
}: ParticleAnimationProps) {
  const { phase, startedAt, ejectiles, incomingParticle, type } = animation;

  const isBetaDecay = type === 'beta';

  // For beta decay: the antineutrino (ν̄ₑ) comes IN, the electron (e⁻) goes OUT
  // Split ejectiles accordingly
  const { outgoing, incoming: betaIncoming } = useMemo(() => {
    if (!isBetaDecay) return { outgoing: ejectiles, incoming: [] };

    const out: Particle[] = [];
    const inc: Particle[] = [];
    for (const p of ejectiles) {
      if (p.symbol === 'ν̄ₑ') {
        inc.push(p);
      } else {
        out.push(p);
      }
    }
    return { outgoing: out, incoming: inc };
  }, [ejectiles, isBetaDecay]);

  // Directions for outgoing particles
  const directions = useMemo(() => {
    const dirs: Vector3[] = [];
    const count = outgoing.length;

    for (let i = 0; i < count; i++) {
      const theta = (i / Math.max(count, 1)) * Math.PI * 2 + Math.random() * 0.5;
      const phi = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
      dirs.push(
        new Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).normalize()
      );
    }
    return dirs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, outgoing.length]);

  // Directions for incoming beta neutrinos (approach from a random direction)
  const betaInDirs = useMemo(() => {
    return betaIncoming.map(() => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
      return new Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, betaIncoming.length]);

  return (
    <group>
      <ReactionFlash phase={phase} startedAt={startedAt} />

      {/* Neutron / Deuterium incoming (non-beta) */}
      {incomingParticle && (
        <IncomingParticle
          particle={incomingParticle}
          phase={phase}
          startedAt={startedAt}
        />
      )}

      {/* Beta decay: neutrino comes IN during reacting phase */}
      {(phase === 'reacting' || phase === 'departing') &&
        betaIncoming.map((particle, i) => (
          <AnimatedParticle
            key={`beta-in-${i}`}
            particle={particle}
            direction={betaInDirs[i] || new Vector3(1, 0, 0)}
            phase={phase}
            startedAt={startedAt}
            index={i + outgoing.length}
            isBetaIncoming
          />
        ))}

      {/* Outgoing particles */}
      {(phase === 'departing' || phase === 'reacting') &&
        outgoing.map((particle, i) => (
          <AnimatedParticle
            key={`${type}-${i}`}
            particle={particle}
            direction={directions[i] || new Vector3(1, 0, 0)}
            phase={phase}
            startedAt={startedAt}
            index={i}
          />
        ))}
    </group>
  );
}
