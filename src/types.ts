export type InstrumentId =
  | 'grand-piano'
  | 'violin'
  | 'cello'
  | 'flute'
  | 'electric-guitar'
  | 'synth-lead'
  | 'bass'
  | 'drum-kit';

export type ScaleId =
  | 'c-major'
  | 'a-minor'
  | 'd-minor'
  | 'g-major'
  | 'pentatonic-major'
  | 'pentatonic-minor';

export type OrchestraLayer = 'strings' | 'brass' | 'bass' | 'choir' | 'percussion';

export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export type Handedness = 'Left' | 'Right';

export type TrackedHand = {
  id: string;
  handedness: Handedness;
  landmarks: Landmark[];
  pinchStrength: number;
  isPinching: boolean;
  drumHit: boolean;
  note: string | null;
  octave: number;
  velocity: number;
  x: number;
  y: number;
  lastSeen: number;
};

export type InstrumentDefinition = {
  id: InstrumentId;
  name: string;
  family: 'keys' | 'strings' | 'wind' | 'guitar' | 'synth' | 'bass' | 'drums';
  mode: 'percussive' | 'sustained' | 'drums';
  color: string;
};

export type AppSettings = {
  selectedInstrument: InstrumentId;
  selectedScale: ScaleId;
  sustain: boolean;
  muted: boolean;
  masterVolume: number;
  orchestraMode: boolean;
  orchestraLayers: Record<OrchestraLayer, boolean>;
  orchestraIntensity: number;
  showLandmarks: boolean;
  onboardingSeen: boolean;
};
