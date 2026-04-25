export interface NucleonPosition {
  position: [number, number, number];
  type: 'proton' | 'neutron';
}

const cache = new Map<string, NucleonPosition[]>();

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateSmallNucleus(
  protons: number,
  neutrons: number,
  nucleonRadius: number
): NucleonPosition[] {
  const total = protons + neutrons;
  const positions: [number, number, number][] = [];
  const spacing = nucleonRadius * 1.8;

  if (total === 1) {
    positions.push([0, 0, 0]);
  } else if (total === 2) {
    positions.push([-spacing * 0.5, 0, 0]);
    positions.push([spacing * 0.5, 0, 0]);
  } else if (total === 3) {
    // Triangle
    const r = spacing * 0.6;
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      positions.push([
        r * Math.cos(angle),
        r * Math.sin(angle),
        0,
      ]);
    }
  } else if (total <= 6) {
    // Center + ring
    positions.push([0, 0, 0]);
    const ringCount = total - 1;
    const r = spacing;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i * 2 * Math.PI) / ringCount;
      positions.push([
        r * Math.cos(angle),
        r * Math.sin(angle),
        0,
      ]);
    }
  } else {
    // Two layers
    const bottomCount = Math.ceil(total / 2);
    const topCount = total - bottomCount;
    const rBottom = spacing * 0.8;
    const rTop = spacing * 0.6;

    for (let i = 0; i < bottomCount; i++) {
      const angle = (i * 2 * Math.PI) / bottomCount;
      positions.push([
        rBottom * Math.cos(angle),
        -spacing * 0.3,
        rBottom * Math.sin(angle),
      ]);
    }
    for (let i = 0; i < topCount; i++) {
      const angle = (i * 2 * Math.PI) / topCount + Math.PI / topCount;
      positions.push([
        rTop * Math.cos(angle),
        spacing * 0.3,
        rTop * Math.sin(angle),
      ]);
    }
  }

  // Assign types: alternate protons and neutrons for visual mixing
  const result: NucleonPosition[] = [];
  let pCount = 0;
  let nCount = 0;

  for (let i = 0; i < positions.length; i++) {
    const needProton = pCount < protons;
    const needNeutron = nCount < neutrons;

    if (needProton && (!needNeutron || i % 2 === 0)) {
      result.push({ position: positions[i], type: 'proton' });
      pCount++;
    } else {
      result.push({ position: positions[i], type: 'neutron' });
      nCount++;
    }
  }

  return result;
}

function generateLargeNucleus(
  protons: number,
  neutrons: number,
  nucleonRadius: number
): NucleonPosition[] {
  const total = protons + neutrons;
  const A = total;
  // Nuclear radius formula: R = r0 * A^(1/3), r0 ~ 1.2 fm
  // Scale so that nucleons fit visually
  const R = nucleonRadius * 1.4 * Math.pow(A, 1 / 3);
  const minDist = nucleonRadius * 1.7;

  const rand = seededRandom(protons * 1000 + neutrons);
  const positions: [number, number, number][] = [];

  let attempts = 0;
  const maxAttempts = total * 200;

  while (positions.length < total && attempts < maxAttempts) {
    attempts++;

    // Generate random point in sphere
    const u = rand();
    const v = rand();
    const w = rand();

    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = R * Math.cbrt(w); // Uniform distribution in volume

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Check for overlap
    let overlaps = false;
    for (const p of positions) {
      const dx = x - p[0];
      const dy = y - p[1];
      const dz = z - p[2];
      if (dx * dx + dy * dy + dz * dz < minDist * minDist) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      positions.push([x, y, z]);
    }
  }

  // If we couldn't place all nucleons, add remaining with slight jitter
  while (positions.length < total) {
    const idx = Math.floor(rand() * positions.length);
    const base = positions[idx];
    const jitter = nucleonRadius * 0.5;
    positions.push([
      base[0] + (rand() - 0.5) * jitter,
      base[1] + (rand() - 0.5) * jitter,
      base[2] + (rand() - 0.5) * jitter,
    ]);
  }

  // Shuffle positions then assign types
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const result: NucleonPosition[] = [];
  for (let i = 0; i < total; i++) {
    result.push({
      position: positions[i],
      type: i < protons ? 'proton' : 'neutron',
    });
  }

  return result;
}

export function generateNucleonPositions(
  protons: number,
  neutrons: number,
  nucleonRadius: number = 0.18
): NucleonPosition[] {
  const key = `${protons}-${neutrons}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const total = protons + neutrons;
  const result =
    total <= 12
      ? generateSmallNucleus(protons, neutrons, nucleonRadius)
      : generateLargeNucleus(protons, neutrons, nucleonRadius);

  cache.set(key, result);
  return result;
}

export function clearLayoutCache(): void {
  cache.clear();
}
