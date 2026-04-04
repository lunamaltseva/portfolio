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
import { temperatureToSliderPosition } from './nuclearData';
import ParticleAnimation from './ParticleAnimation';

interface NucleusViewProps {
  isotope: Isotope | null;
  animation: AnimationState | null;
  isMobile: boolean;
  temperature: number;
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
            currentPos.current[i].copy(rest).add(pull);
          } else {
            currentPos.current[i].copy(rest);
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
      // so it's visible as soon as the slider moves off zero
      const sliderPos = temperatureToSliderPosition(temperature);
      const jitterStrength = sliderPos * NUCLEON_RADIUS * 0.4;

      if (jitterStrength > 0.0001) {
        for (let i = 0; i < types.length; i++) {
          const rest = restPositions.current[i];
          const cur = currentPos.current[i];
          if (!rest || !cur) continue;

          const jx = (Math.random() - 0.5) * 2 * jitterStrength;
          const jy = (Math.random() - 0.5) * 2 * jitterStrength;
          const jz = (Math.random() - 0.5) * 2 * jitterStrength;

          cur.set(rest.x + jx, rest.y + jy, rest.z + jz);
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

function Scene({
  isotope,
  animation,
  isMobile,
  temperature,
}: NucleusViewProps) {
  const total = isotope ? isotope.protons + isotope.neutrons : 0;
  const cameraZ = total > 0 ? 3 + Math.pow(total, 1 / 3) * 1.2 : 5;

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

      {isotope ? (
        <NucleusMesh
          isotope={isotope}
          isMobile={isMobile}
          temperature={temperature}
          orbitControlsRef={orbitControlsRef}
        />
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
      />
    </Canvas>
  );
}
