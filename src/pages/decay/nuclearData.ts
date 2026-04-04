export type ReactionType =
  | 'alpha'
  | 'beta'
  | 'gamma'
  | 'neutron-collision'
  | 'deuterium-collision'
  | 'fission';

export interface Particle {
  label: string;
  symbol: string;
  protons: number;
  neutrons: number;
  color: string;
  radius: number;
}

export interface Isotope {
  id: string;
  symbol: string;
  name: string;
  protons: number;
  neutrons: number;
  isStable: boolean;
}

export interface Reaction {
  type: ReactionType;
  label: string;
  description: string;
  productId: string;
  ejectiles: Particle[];
  minTemperature: number;
  maxTemperature: number;
  requiresExcitedState: boolean;
  energyReleased: string;
}

export interface IsotopeEntry {
  isotope: Isotope;
  reactions: Reaction[];
}

// --- Particle definitions ---

const ALPHA_PARTICLE: Particle = {
  label: 'Alpha particle',
  symbol: 'α (He-4)',
  protons: 2,
  neutrons: 2,
  color: '#f1c40f',
  radius: 0.35,
};

const ELECTRON: Particle = {
  label: 'Electron',
  symbol: 'e⁻',
  protons: 0,
  neutrons: 0,
  color: '#3498db',
  radius: 0.12,
};

const ANTINEUTRINO: Particle = {
  label: 'Antineutrino',
  symbol: 'ν̄ₑ',
  protons: 0,
  neutrons: 0,
  color: '#ecf0f1',
  radius: 0.08,
};

const NEUTRON: Particle = {
  label: 'Neutron',
  symbol: 'n',
  protons: 0,
  neutrons: 1,
  color: '#7f8c8d',
  radius: 0.2,
};

const PROTON: Particle = {
  label: 'Proton',
  symbol: 'p',
  protons: 1,
  neutrons: 0,
  color: '#e74c3c',
  radius: 0.2,
};

const GAMMA_RAY: Particle = {
  label: 'Gamma ray',
  symbol: 'γ',
  protons: 0,
  neutrons: 0,
  color: '#9b59b6',
  radius: 0.15,
};

// --- Fission fragment particles (for display when flying away) ---

const KR90_FRAGMENT: Particle = {
  label: 'Krypton-90',
  symbol: 'Kr-90',
  protons: 36,
  neutrons: 54,
  color: '#1abc9c',
  radius: 0.8,
};

const BA144_FRAGMENT: Particle = {
  label: 'Barium-144',
  symbol: 'Ba-144',
  protons: 56,
  neutrons: 88,
  color: '#e67e22',
  radius: 0.9,
};

const TE139_FRAGMENT: Particle = {
  label: 'Tellurium-139',
  symbol: 'Te-139',
  protons: 52,
  neutrons: 87,
  color: '#e67e22',
  radius: 0.9,
};

const DEUTERIUM_PARTICLE: Particle = {
  label: 'Deuterium',
  symbol: 'D',
  protons: 1,
  neutrons: 1,
  color: '#2ecc71',
  radius: 0.25,
};

const HE4_PARTICLE: Particle = {
  label: 'Helium-4',
  symbol: 'He-4',
  protons: 2,
  neutrons: 2,
  color: '#f1c40f',
  radius: 0.35,
};

// --- Isotope registry ---

function iso(
  id: string,
  symbol: string,
  name: string,
  protons: number,
  neutrons: number,
  isStable: boolean = false
): Isotope {
  return { id, symbol, name, protons, neutrons, isStable };
}

const ISOTOPES: Record<string, Isotope> = {
  'U-235': iso('U-235', '²³⁵U', 'Uranium-235', 92, 143),
  'U-236': iso('U-236', '²³⁶U', 'Uranium-236', 92, 144),
  'U-238': iso('U-238', '²³⁸U', 'Uranium-238', 92, 146),
  'U-239': iso('U-239', '²³⁹U', 'Uranium-239', 92, 147),
  'U-234': iso('U-234', '²³⁴U', 'Uranium-234', 92, 142),
  'H-3': iso('H-3', '³H', 'Tritium', 1, 2),
  'He-3': iso('He-3', '³He', 'Helium-3', 2, 1, true),
  'He-4': iso('He-4', '⁴He', 'Helium-4', 2, 2, true),
  'Th-231': iso('Th-231', '²³¹Th', 'Thorium-231', 90, 141),
  'Th-234': iso('Th-234', '²³⁴Th', 'Thorium-234', 90, 144),
  'Th-232': iso('Th-232', '²³²Th', 'Thorium-232', 90, 142),
  'Th-230': iso('Th-230', '²³⁰Th', 'Thorium-230', 90, 140),
  'Pa-231': iso('Pa-231', '²³¹Pa', 'Protactinium-231', 91, 140),
  'Pa-234': iso('Pa-234', '²³⁴Pa', 'Protactinium-234', 91, 143),
  'Ac-227': iso('Ac-227', '²²⁷Ac', 'Actinium-227', 89, 138),
  'Ra-226': iso('Ra-226', '²²⁶Ra', 'Radium-226', 88, 138),
  'Ra-228': iso('Ra-228', '²²⁸Ra', 'Radium-228', 88, 140),
  'Np-239': iso('Np-239', '²³⁹Np', 'Neptunium-239', 93, 146),
  'Pu-239': iso('Pu-239', '²³⁹Pu', 'Plutonium-239', 94, 145),
  'Ba-144': iso('Ba-144', '¹⁴⁴Ba', 'Barium-144', 56, 88),
  'Kr-90': iso('Kr-90', '⁹⁰Kr', 'Krypton-90', 36, 54),
  'La-144': iso('La-144', '¹⁴⁴La', 'Lanthanum-144', 57, 87),
  'Ce-144': iso('Ce-144', '¹⁴⁴Ce', 'Cerium-144', 58, 86, true),
  'Rb-90': iso('Rb-90', '⁹⁰Rb', 'Rubidium-90', 37, 53),
  'Sr-90': iso('Sr-90', '⁹⁰Sr', 'Strontium-90', 38, 52),
  'Zr-94': iso('Zr-94', '⁹⁴Zr', 'Zirconium-94', 40, 54, true),
  'Te-139': iso('Te-139', '¹³⁹Te', 'Tellurium-139', 52, 87),
};

// --- Reaction definitions per isotope ---

const REGISTRY: Record<string, IsotopeEntry> = {
  'U-235': {
    isotope: ISOTOPES['U-235'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁵U → ²³¹Th + α',
        productId: 'Th-231',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.68 MeV',
      },
      {
        type: 'neutron-collision',
        label: 'Neutron Capture',
        description: '²³⁵U + n → ²³⁶U*',
        productId: 'U-236',
        ejectiles: [],
        minTemperature: 0,
        maxTemperature: 10_000_000,
        requiresExcitedState: false,
        energyReleased: '6.55 MeV',
      },
      {
        type: 'fission',
        label: 'Fission',
        description: '²³⁵U + n → ¹⁴⁴Ba + ⁹⁰Kr + 2n',
        productId: 'Ba-144',
        ejectiles: [KR90_FRAGMENT, NEUTRON, NEUTRON],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '~200 MeV',
      },
      {
        type: 'gamma',
        label: 'Gamma Emission',
        description: '²³⁵U* → ²³⁵U + γ',
        productId: 'U-235',
        ejectiles: [GAMMA_RAY],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: true,
        energyReleased: '0.1–1 MeV',
      },
    ],
  },
  'U-238': {
    isotope: ISOTOPES['U-238'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁸U → ²³⁴Th + α',
        productId: 'Th-234',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.27 MeV',
      },
      {
        type: 'neutron-collision',
        label: 'Neutron Capture',
        description: '²³⁸U + n → ²³⁹U*',
        productId: 'U-239',
        ejectiles: [],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.81 MeV',
      },
      {
        type: 'fission',
        label: 'Fission (fast n)',
        description: '²³⁸U + n → ⁹⁴Zr + ¹³⁹Te + 3n',
        productId: 'Zr-94',
        ejectiles: [TE139_FRAGMENT, NEUTRON, NEUTRON, NEUTRON],
        minTemperature: 10_000_000,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '~200 MeV',
      },
      {
        type: 'gamma',
        label: 'Gamma Emission',
        description: '²³⁸U* → ²³⁸U + γ',
        productId: 'U-238',
        ejectiles: [GAMMA_RAY],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: true,
        energyReleased: '0.05–1 MeV',
      },
    ],
  },
  'H-3': {
    isotope: ISOTOPES['H-3'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '³H → ³He + e⁻ + ν̄ₑ',
        productId: 'He-3',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '18.6 keV',
      },
      {
        type: 'deuterium-collision',
        label: 'D-T Fusion',
        description: '³H + ²H → ⁴He + n',
        productId: 'He-4',
        ejectiles: [NEUTRON],
        minTemperature: 100_000_000,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '17.6 MeV',
      },
    ],
  },
  'He-3': {
    isotope: ISOTOPES['He-3'],
    reactions: [
      {
        type: 'deuterium-collision',
        label: 'D-³He Fusion',
        description: '³He + ²H → ⁴He + p',
        productId: 'He-4',
        ejectiles: [PROTON],
        minTemperature: 150_000_000,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '18.3 MeV',
      },
    ],
  },
  'He-4': {
    isotope: ISOTOPES['He-4'],
    reactions: [],
  },
  'Th-231': {
    isotope: ISOTOPES['Th-231'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '²³¹Th → ²³¹Pa + e⁻ + ν̄ₑ',
        productId: 'Pa-231',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '0.39 MeV',
      },
    ],
  },
  'Th-234': {
    isotope: ISOTOPES['Th-234'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '²³⁴Th → ²³⁴Pa + e⁻ + ν̄ₑ',
        productId: 'Pa-234',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '0.27 MeV',
      },
    ],
  },
  'Th-232': {
    isotope: ISOTOPES['Th-232'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³²Th → ²²⁸Ra + α',
        productId: 'Ra-228',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.08 MeV',
      },
    ],
  },
  'Th-230': {
    isotope: ISOTOPES['Th-230'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁰Th → ²²⁶Ra + α',
        productId: 'Ra-226',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.77 MeV',
      },
    ],
  },
  'Pa-231': {
    isotope: ISOTOPES['Pa-231'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³¹Pa → ²²⁷Ac + α',
        productId: 'Ac-227',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '5.15 MeV',
      },
    ],
  },
  'Pa-234': {
    isotope: ISOTOPES['Pa-234'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '²³⁴Pa → ²³⁴U + e⁻ + ν̄ₑ',
        productId: 'U-234',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '2.20 MeV',
      },
    ],
  },
  'Ac-227': {
    isotope: ISOTOPES['Ac-227'],
    reactions: [],
  },
  'Ra-226': {
    isotope: ISOTOPES['Ra-226'],
    reactions: [],
  },
  'Ra-228': {
    isotope: ISOTOPES['Ra-228'],
    reactions: [],
  },
  'U-234': {
    isotope: ISOTOPES['U-234'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁴U → ²³⁰Th + α',
        productId: 'Th-230',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.86 MeV',
      },
    ],
  },
  'U-236': {
    isotope: ISOTOPES['U-236'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁶U → ²³²Th + α',
        productId: 'Th-232',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.57 MeV',
      },
      {
        type: 'gamma',
        label: 'Gamma Emission',
        description: '²³⁶U* → ²³⁶U + γ',
        productId: 'U-236',
        ejectiles: [GAMMA_RAY],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: true,
        energyReleased: '~1 MeV',
      },
    ],
  },
  'U-239': {
    isotope: ISOTOPES['U-239'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '²³⁹U → ²³⁹Np + e⁻ + ν̄ₑ',
        productId: 'Np-239',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '1.26 MeV',
      },
      {
        type: 'gamma',
        label: 'Gamma Emission',
        description: '²³⁹U* → ²³⁹U + γ',
        productId: 'U-239',
        ejectiles: [GAMMA_RAY],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: true,
        energyReleased: '~0.5 MeV',
      },
    ],
  },
  'Np-239': {
    isotope: ISOTOPES['Np-239'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '²³⁹Np → ²³⁹Pu + e⁻ + ν̄ₑ',
        productId: 'Pu-239',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '0.72 MeV',
      },
    ],
  },
  'Pu-239': {
    isotope: ISOTOPES['Pu-239'],
    reactions: [
      {
        type: 'alpha',
        label: 'Alpha Decay',
        description: '²³⁹Pu → ²³⁵U + α',
        productId: 'U-235',
        ejectiles: [ALPHA_PARTICLE],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '5.24 MeV',
      },
      {
        type: 'fission',
        label: 'Fission',
        description: '²³⁹Pu + n → fission products',
        productId: 'Ba-144',
        ejectiles: [KR90_FRAGMENT, NEUTRON, NEUTRON, NEUTRON],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '~207 MeV',
      },
    ],
  },
  'Ba-144': {
    isotope: ISOTOPES['Ba-144'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '¹⁴⁴Ba → ¹⁴⁴La + e⁻ + ν̄ₑ',
        productId: 'La-144',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '3.16 MeV',
      },
    ],
  },
  'Kr-90': {
    isotope: ISOTOPES['Kr-90'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '⁹⁰Kr → ⁹⁰Rb + e⁻ + ν̄ₑ',
        productId: 'Rb-90',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '4.39 MeV',
      },
    ],
  },
  'La-144': {
    isotope: ISOTOPES['La-144'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '¹⁴⁴La → ¹⁴⁴Ce + e⁻ + ν̄ₑ',
        productId: 'Ce-144',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '3.30 MeV',
      },
    ],
  },
  'Ce-144': {
    isotope: ISOTOPES['Ce-144'],
    reactions: [],
  },
  'Rb-90': {
    isotope: ISOTOPES['Rb-90'],
    reactions: [
      {
        type: 'beta',
        label: 'Beta Decay',
        description: '⁹⁰Rb → ⁹⁰Sr + e⁻ + ν̄ₑ',
        productId: 'Sr-90',
        ejectiles: [ELECTRON, ANTINEUTRINO],
        minTemperature: 0,
        maxTemperature: Infinity,
        requiresExcitedState: false,
        energyReleased: '6.59 MeV',
      },
    ],
  },
  'Sr-90': {
    isotope: ISOTOPES['Sr-90'],
    reactions: [],
  },
  'Zr-94': {
    isotope: ISOTOPES['Zr-94'],
    reactions: [],
  },
  'Te-139': {
    isotope: ISOTOPES['Te-139'],
    reactions: [],
  },
};

export function getIsotopeEntry(id: string): IsotopeEntry | undefined {
  return REGISTRY[id];
}

export function getAvailableReactions(
  isotopeId: string,
  temperature: number,
  isExcited: boolean = false
): Reaction[] {
  const entry = REGISTRY[isotopeId];
  if (!entry) return [];

  return entry.reactions.filter((r) => {
    if (r.requiresExcitedState && !isExcited) return false;
    if (temperature < r.minTemperature) return false;
    if (temperature > r.maxTemperature) return false;
    return true;
  });
}

export function getAllReactions(isotopeId: string): Reaction[] {
  const entry = REGISTRY[isotopeId];
  if (!entry) return [];
  return entry.reactions;
}

export const STARTER_ISOTOPES = [
  ISOTOPES['U-235'],
  ISOTOPES['U-238'],
  ISOTOPES['H-3'],
];

/** Convert a raw temperature (K) to a 0–1 slider position on the log scale. */
export function temperatureToSliderPosition(temp: number): number {
  if (temp <= 100) return 0;
  const minLog = 2; // log10(100)
  const maxLog = Math.log10(150_000_000);
  const logVal = Math.log10(temp);
  return Math.min(1, Math.max(0, (logVal - minLog) / (maxLog - minLog)));
}

export { ISOTOPES, DEUTERIUM_PARTICLE, HE4_PARTICLE, NEUTRON as NEUTRON_PARTICLE, BA144_FRAGMENT };
