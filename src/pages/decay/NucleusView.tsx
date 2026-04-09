import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type {
  InstancedMesh as InstancedMeshType,
  Group,
} from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Object3D, Vector3, Raycaster, Vector2, Color } from 'three';
import type { Isotope } from './nuclearData';
import type { AnimationState } from './useAtomState';
import { generateNucleonPositions } from './nucleonLayout';
import { temperatureToSliderPosition, getElectronShells } from './nuclearData';
import ParticleAnimation from './ParticleAnimation';

interface NucleusViewProps {
  isotope: Isotope | null;
  animation: AnimationState | null;
  isMobile: boolean;
  temperature: number;
  microwaving?: boolean;
}

const NUCLEON_RADIUS = 0.18;
const PROTON_COLOR = new Color('#e63535');
const NEUTRON_COLOR = new Color('#3b6fd4');

// Drag physics constants
const DRAG_INFLUENCE_RADIUS = 1.8;
const DRAG_SNAP_SPEED = 8;
const DRAG_MAX_STRETCH = 4.0;

interface NucleusMeshProps {
  isotope: Isotope;
  isMobile: boolean;
  temperature: number;
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
}

interface DragState {
  anchorIndex: number;
  dragOffset: Vector3;
  startPos: Vector3;
}

function NucleusMesh({
  isotope,
  isMobile,
  temperature,
  orbitControlsRef,
}: NucleusMeshProps) {
  const protonRef = useRef<InstancedMeshType>(null);
  const neutronRef = useRef<InstancedMeshType>(null);
  const groupRef = useRef<Group>(null);
  const { camera, gl } = useThree();

  const positions = useMemo(
    () =>
      generateNucleonPositions(
        isotope.protons,
        isotope.neutrons,
        NUCLEON_RADIUS
      ),
    [isotope.protons, isotope.neutrons]
  );

  // Track types in a ref so reshuffle doesn't break color mapping
  const nucleonTypes = useRef<('proton' | 'neutron')[]>([]);
  const restPositions = useRef<Vector3[]>([]);
  const currentPos = useRef<Vector3[]>([]);
  const snappingBack = useRef(false);
  const needsReshuffle = useRef(false);

  const [drag, setDrag] = useState<DragState | null>(null);

  // Initialize when isotope changes
  useEffect(() => {
    const allPos: Vector3[] = [];
    const allTypes: ('proton' | 'neutron')[] = [];
    for (const p of positions) {
      allPos.push(new Vector3(...p.position));
      allTypes.push(p.type);
    }
    restPositions.current = allPos;
    currentPos.current = allPos.map((v) => v.clone());
    nucleonTypes.current = allTypes;
    snappingBack.current = false;
    syncMeshes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions]);

  const syncMeshes = useCallback(() => {
    const dummy = new Object3D();
    let protonIdx = 0;
    let neutronIdx = 0;
    const types = nucleonTypes.current;

    for (let i = 0; i < types.length; i++) {
      const pos = currentPos.current[i];
      if (!pos) continue;
      dummy.position.copy(pos);
      dummy.updateMatrix();

      if (types[i] === 'proton' && protonRef.current) {
        protonRef.current.setMatrixAt(protonIdx, dummy.matrix);
        protonIdx++;
      } else if (types[i] === 'neutron' && neutronRef.current) {
        neutronRef.current.setMatrixAt(neutronIdx, dummy.matrix);
        neutronIdx++;
      }
    }

    if (protonRef.current)
      protonRef.current.instanceMatrix.needsUpdate = true;
    if (neutronRef.current)
      neutronRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Per-frame: drag, snap back, and temperature jitter
  useFrame((_state, delta) => {
    const types = nucleonTypes.current;
    // Guard: if refs are out of sync with mesh counts, skip this frame
    if (types.length !== currentPos.current.length || types.length === 0) return;

    // Compute jitter once — applied in all branches except snap-back
    const sliderPos = temperatureToSliderPosition(temperature);
    const jitterStrength = sliderPos * NUCLEON_RADIUS * 0.4;

    const jitter = (base: Vector3, cur: Vector3) => {
      if (jitterStrength > 0.0001) {
        cur.set(
          base.x + (Math.random() - 0.5) * 2 * jitterStrength,
          base.y + (Math.random() - 0.5) * 2 * jitterStrength,
          base.z + (Math.random() - 0.5) * 2 * jitterStrength
        );
      } else {
        cur.copy(base);
      }
    };

    if (drag) {
      const dragDist = drag.dragOffset.length();

      for (let i = 0; i < types.length; i++) {
        const rest = restPositions.current[i];
        if (!rest) continue;

        if (i === drag.anchorIndex) {
          currentPos.current[i].copy(rest).add(drag.dragOffset);
        } else {
          const dist = rest.distanceTo(
            restPositions.current[drag.anchorIndex]
          );
          if (dist < DRAG_INFLUENCE_RADIUS && dist > 0) {
            const influence = 1 - dist / DRAG_INFLUENCE_RADIUS;
            const pull = drag.dragOffset
              .clone()
              .multiplyScalar(influence * 0.7);
            const base = rest.clone().add(pull);
            jitter(base, currentPos.current[i]);
          } else {
            jitter(rest, currentPos.current[i]);
          }
        }
      }

      if (dragDist > DRAG_MAX_STRETCH) {
        // Release and snap
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
        setDrag(null);
        snappingBack.current = true;
        needsReshuffle.current = true;
      }

      syncMeshes();
    } else if (snappingBack.current) {
      let allSettled = true;

      for (let i = 0; i < types.length; i++) {
        const rest = restPositions.current[i];
        const cur = currentPos.current[i];
        if (!rest || !cur) continue;

        cur.lerp(rest, Math.min(1, DRAG_SNAP_SPEED * delta));

        if (cur.distanceTo(rest) > 0.001) {
          allSettled = false;
        }

        // Apply jitter on top of the lerp so vibration continues during snap-back
        if (jitterStrength > 0.0001) {
          cur.set(
            cur.x + (Math.random() - 0.5) * 2 * jitterStrength,
            cur.y + (Math.random() - 0.5) * 2 * jitterStrength,
            cur.z + (Math.random() - 0.5) * 2 * jitterStrength
          );
        }
      }

      syncMeshes();

      if (allSettled) {
        snappingBack.current = false;
        if (needsReshuffle.current) {
          needsReshuffle.current = false;
          reshufflePositions();
        }
      }
    } else {
      // Temperature jitter — based on the log-scale slider position
      if (jitterStrength > 0.0001) {
        for (let i = 0; i < types.length; i++) {
          const rest = restPositions.current[i];
          const cur = currentPos.current[i];
          if (!rest || !cur) continue;
          jitter(rest, cur);
        }
        syncMeshes();
      }
    }
  });

  const reshufflePositions = useCallback(() => {
    const allPos = restPositions.current;
    const allTypes = nucleonTypes.current;
    // Shuffle positions AND types together so colors stay consistent
    for (let i = allPos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Swap positions
      const tmpPos = allPos[i].clone();
      allPos[i].copy(allPos[j]);
      allPos[j].copy(tmpPos);
      // Swap types
      const tmpType = allTypes[i];
      allTypes[i] = allTypes[j];
      allTypes[j] = tmpType;
    }
    for (let i = 0; i < allPos.length; i++) {
      currentPos.current[i].copy(allPos[i]);
    }
    syncMeshes();
  }, [syncMeshes]);

  // Map instanceId back to combined index
  const getCombinedIndex = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any): number => {
      const instanceId = e.instanceId as number;
      const isProton = e.object === protonRef.current;
      const types = nucleonTypes.current;

      let count = 0;
      for (let i = 0; i < types.length; i++) {
        if (
          (isProton && types[i] === 'proton') ||
          (!isProton && types[i] === 'neutron')
        ) {
          if (count === instanceId) return i;
          count++;
        }
      }
      return -1;
    },
    []
  );

  const handlePointerDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (e.instanceId === undefined) return;
      e.stopPropagation?.();

      const combinedIdx = getCombinedIndex(e);
      if (combinedIdx < 0) return;

      const rest = restPositions.current[combinedIdx];
      if (!rest) return;

      // Disable orbit controls while dragging
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      setDrag({
        anchorIndex: combinedIdx,
        dragOffset: new Vector3(0, 0, 0),
        startPos: rest.clone(),
      });
    },
    [getCombinedIndex, orbitControlsRef]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const worldStart = drag.startPos.clone();
      if (groupRef.current) {
        groupRef.current.localToWorld(worldStart);
      }

      const planeNormal = new Vector3();
      camera.getWorldDirection(planeNormal);
      const planeDot = planeNormal.dot(worldStart);

      const rayDir = raycaster.ray.direction.clone();
      const rayOrigin = raycaster.ray.origin.clone();
      const denom = planeNormal.dot(rayDir);

      if (Math.abs(denom) < 0.001) return;

      const t = (planeDot - planeNormal.dot(rayOrigin)) / denom;
      const worldPos = rayOrigin.add(rayDir.multiplyScalar(t));

      if (groupRef.current) {
        groupRef.current.worldToLocal(worldPos);
      }

      const offset = worldPos.sub(drag.startPos);

      setDrag((prev) => (prev ? { ...prev, dragOffset: offset } : null));
    },
    [drag, camera, gl]
  );

  const handlePointerUp = useCallback(() => {
    if (drag) {
      snappingBack.current = true;
      needsReshuffle.current = drag.dragOffset.length() > 0.1;
    }
    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    setDrag(null);
  }, [drag, orbitControlsRef]);

  useEffect(() => {
    if (drag) {
      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
      return () => {
        gl.domElement.removeEventListener('pointermove', handlePointerMove);
        gl.domElement.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [drag, handlePointerMove, handlePointerUp, gl.domElement]);

  const segments = isMobile ? 12 : 24;

  // Use isotope props directly for instance counts — refs may lag behind
  const protonCount = isotope.protons;
  const neutronCount = isotope.neutrons;

  return (
    <group ref={groupRef}>
      {protonCount > 0 && (
        <instancedMesh
          key={`p-${protonCount}`}
          ref={protonRef}
          args={[undefined, undefined, protonCount]}
          onPointerDown={handlePointerDown}
        >
          <sphereGeometry args={[NUCLEON_RADIUS, segments, segments]} />
          <meshPhongMaterial
            color={PROTON_COLOR}
            specular={new Color('#ffaaaa')}
            shininess={80}
            emissive={new Color('#330000')}
          />
        </instancedMesh>
      )}
      {neutronCount > 0 && (
        <instancedMesh
          key={`n-${neutronCount}`}
          ref={neutronRef}
          args={[undefined, undefined, neutronCount]}
          onPointerDown={handlePointerDown}
        >
          <sphereGeometry args={[NUCLEON_RADIUS, segments, segments]} />
          <meshPhongMaterial
            color={NEUTRON_COLOR}
            specular={new Color('#aaaaff')}
            shininess={80}
            emissive={new Color('#000033')}
          />
        </instancedMesh>
      )}
    </group>
  );
}

function EmptyState() {
  return null;
}

const BG_NEUTRON_COUNT = 16;

// Pre-compute random orbital parameters for each background neutron
const bgNeutronParams = Array.from({ length: BG_NEUTRON_COUNT }, (_, i) => ({
  // Orbital radii and speeds — varied so they don't clump
  rx: 6 + (i % 4) * 3 + Math.sin(i * 2.1) * 2,
  ry: 5 + ((i + 1) % 3) * 3 + Math.cos(i * 1.7) * 2,
  rz: 5 + ((i + 2) % 5) * 2.5 + Math.sin(i * 0.9) * 2,
  // Speed multipliers — fast whooshing
  sx: 0.6 + (i * 0.17) % 0.8,
  sy: 0.5 + (i * 0.23) % 0.7,
  sz: 0.4 + (i * 0.13) % 0.9,
  // Phase offsets to spread them out
  px: (i * 1.37) % (Math.PI * 2),
  py: (i * 2.03) % (Math.PI * 2),
  pz: (i * 0.89) % (Math.PI * 2),
}));

function BackgroundNeutrons() {
  const meshRef = useRef<InstancedMeshType>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const dummy = new Object3D();

    for (let i = 0; i < BG_NEUTRON_COUNT; i++) {
      const p = bgNeutronParams[i];
      dummy.position.set(
        Math.sin(t * p.sx + p.px) * p.rx,
        Math.cos(t * p.sy + p.py) * p.ry,
        Math.sin(t * p.sz + p.pz) * p.rz
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BG_NEUTRON_COUNT]}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial
        color="#7f8c8d"
        emissive="#7f8c8d"
        emissiveIntensity={0.3}
        transparent
        opacity={0.35}
      />
    </instancedMesh>
  );
}

interface ElectronShellsProps {
  protons: number;
  nucleusRadius: number;
  microwaving: boolean;
}

// Per-shell random tumble speeds (seeded by index, stable across renders)
const SHELL_TUMBLE = Array.from({ length: 10 }, (_, i) => ({
  pitchSpeed: 1.2 + (i * 0.73) % 1.5,
  rollSpeed: 0.9 + (i * 1.17) % 1.8,
  pitchPhase: (i * 2.31) % (Math.PI * 2),
  rollPhase: (i * 1.67) % (Math.PI * 2),
}));

function ElectronShells({ protons, nucleusRadius, microwaving }: ElectronShellsProps) {
  const shells = useMemo(() => getElectronShells(protons), [protons]);
  const electronRefs = useRef<(InstancedMeshType | null)[]>([]);
  const shellGroupRefs = useRef<(Group | null)[]>([]);
  const colorRef = useRef(new Color('#2ecc71'));

  // Minimum orbit radius: ensure inner shell clears the nucleus
  const minOrbitRadius = nucleusRadius + 0.5;
  const shellSpacing = 0.55;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dummy = new Object3D();

    if (microwaving) {
      colorRef.current.setHSL((t * 3) % 1, 1, 0.5);
    } else {
      colorRef.current.set('#2ecc71');
    }

    shells.forEach((count, shellIdx) => {
      const mesh = electronRefs.current[shellIdx];
      const shellGroup = shellGroupRefs.current[shellIdx];

      // Apply axial tumble to the shell group when microwaving
      if (shellGroup) {
        if (microwaving) {
          const tumble = SHELL_TUMBLE[shellIdx % SHELL_TUMBLE.length];
          shellGroup.rotation.x = Math.sin(t * tumble.pitchSpeed + tumble.pitchPhase) * Math.PI * 0.4;
          shellGroup.rotation.z = Math.cos(t * tumble.rollSpeed + tumble.rollPhase) * Math.PI * 0.3;
        } else {
          // Smoothly return to flat
          shellGroup.rotation.x *= 0.9;
          shellGroup.rotation.z *= 0.9;
        }
      }

      if (!mesh) return;

      const radius = minOrbitRadius + shellIdx * shellSpacing;
      // When microwaving: fast spin; otherwise: gentle orbit
      const angularSpeed = microwaving ? (4 + shellIdx * 0.5) : (0.5 / (shellIdx + 1));

      // Update color
      const mat = mesh.material as import('three').MeshStandardMaterial;
      if (mat) {
        mat.color.copy(colorRef.current);
        mat.emissive.copy(colorRef.current);
      }

      // All orbits in the horizontal (XZ) plane
      for (let e = 0; e < count; e++) {
        const angle = (e / count) * Math.PI * 2 + t * angularSpeed;
        dummy.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(e, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {shells.map((count, shellIdx) => {
        const radius = minOrbitRadius + shellIdx * shellSpacing;
        return (
          <group
            key={shellIdx}
            ref={(el) => { shellGroupRefs.current[shellIdx] = el; }}
          >
            {/* Orbit ring — flat in XZ plane */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius, 0.01, 8, 64]} />
              <meshStandardMaterial
                color="#666666"
                transparent
                opacity={0.3}
              />
            </mesh>
            {/* Electrons */}
            <instancedMesh
              ref={(el) => {
                electronRefs.current[shellIdx] = el;
              }}
              args={[undefined, undefined, count]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial
                color="#2ecc71"
                emissive="#2ecc71"
                emissiveIntensity={0.8}
              />
            </instancedMesh>
          </group>
        );
      })}
    </group>
  );
}

function Scene({
  isotope,
  animation,
  isMobile,
  temperature,
  microwaving = false,
}: NucleusViewProps) {
  const total = isotope ? isotope.protons + isotope.neutrons : 0;
  const shellCount = isotope ? getElectronShells(isotope.protons).length : 0;
  const cameraZ = total > 0 ? 3 + Math.pow(total, 1 / 3) * 1.2 + shellCount * 0.8 : 5;

  const nucleusRadius = total > 0 ? NUCLEON_RADIUS * 1.4 * Math.pow(total, 1 / 3) : 1;

  const { camera } = useThree();
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);
  }, [camera, cameraZ]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 10]}
        intensity={1.2}
        color="#ffffff"
      />
      <directionalLight
        position={[-4, -3, -6]}
        intensity={0.5}
        color="#aabbff"
      />
      <pointLight position={[0, 10, 0]} intensity={0.4} color="#ffffff" />
      <hemisphereLight args={['#ffffff', '#444466', 0.4]} />

      <BackgroundNeutrons />

      {isotope ? (
        <>
          <NucleusMesh
            isotope={isotope}
            isMobile={isMobile}
            temperature={temperature}
            orbitControlsRef={orbitControlsRef}
          />
          <ElectronShells
            protons={isotope.protons}
            nucleusRadius={nucleusRadius}
            microwaving={microwaving}
          />
        </>
      ) : (
        <EmptyState />
      )}

      {animation && <ParticleAnimation animation={animation} />}

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={cameraZ * 3}
        enableDamping
        dampingFactor={0.1}
        enableRotate={true}
      />
    </>
  );
}

// Compute background color from temperature using log-scale slider position
function getBackgroundColor(temperature: number): string {
  const t = temperatureToSliderPosition(temperature);
  // Dark blue: rgb(8, 8, 32)  →  Dark red: rgb(48, 4, 8)
  const r = Math.round(8 + t * 40);
  const g = Math.round(8 - t * 4);
  const b = Math.round(32 - t * 24);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function NucleusView({
  isotope,
  animation,
  isMobile,
  temperature,
  microwaving = false,
}: NucleusViewProps) {
  const bg = getBackgroundColor(temperature);

  return (
    <Canvas
      style={{ background: bg }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 2)}
    >
      <Scene
        isotope={isotope}
        animation={animation}
        isMobile={isMobile}
        temperature={temperature}
        microwaving={microwaving}
      />
    </Canvas>
  );
}
