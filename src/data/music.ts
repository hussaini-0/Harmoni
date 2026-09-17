import type { InstrumentDefinition, InstrumentId, OrchestraLayer, ScaleId } from '../types';

export const instruments: InstrumentDefinition[] = [
  { id: 'grand-piano', name: 'Grand Piano', family: 'keys', mode: 'percussive', color: '#f8d57e' },
  { id: 'violin', name: 'Violin', family: 'strings', mode: 'sustained', color: '#f59e0b' },
  { id: 'cello', name: 'Cello', family: 'strings', mode: 'sustained', color: '#c084fc' },
  { id: 'flute', name: 'Flute', family: 'wind', mode: 'sustained', color: '#67e8f9' },
  { id: 'electric-guitar', name: 'Electric Guitar', family: 'guitar', mode: 'sustained', color: '#fb7185' },
  { id: 'synth-lead', name: 'Synth Lead', family: 'synth', mode: 'sustained', color: '#818cf8' },
  { id: 'bass', name: 'Bass', family: 'bass', mode: 'sustained', color: '#34d399' },
  { id: 'drum-kit', name: 'Drum Kit', family: 'drums', mode: 'drums', color: '#f97316' },
];

export const instrumentById = instruments.reduce(
  (map, instrument) => ({ ...map, [instrument.id]: instrument }),
  {} as Record<InstrumentId, InstrumentDefinition>,
);

export const scales: Record<ScaleId, { name: string; root: string; notes: string[] }> = {
  'c-major': { name: 'C Major', root: 'C', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  'a-minor': { name: 'A Minor', root: 'A', notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  'd-minor': { name: 'D Minor', root: 'D', notes: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'] },
  'g-major': { name: 'G Major', root: 'G', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  'pentatonic-major': { name: 'Pentatonic Major', root: 'C', notes: ['C', 'D', 'E', 'G', 'A'] },
  'pentatonic-minor': { name: 'Pentatonic Minor', root: 'A', notes: ['A', 'C', 'D', 'E', 'G'] },
};

export const orchestraLayerLabels: Record<OrchestraLayer, string> = {
  strings: 'Strings',
  brass: 'Brass',
  bass: 'Bass',
  choir: 'Choir',
  percussion: 'Percussion',
};

export const drumPads = [
  { name: 'Kick', key: 'C2' },
  { name: 'Snare', key: 'D2' },
  { name: 'Hat', key: 'F#2' },
  { name: 'Clap', key: 'E2' },
  { name: 'Tom', key: 'A2' },
  { name: 'Cymbal', key: 'C#3' },
];

export function noteForPosition(x: number, y: number, scaleId: ScaleId): { note: string; octave: number } {
  const scale = scales[scaleId];
  const playableX = Math.min(0.98, Math.max(0.02, x));
  const noteIndex = Math.floor(playableX * scale.notes.length * 2.2);
  const degree = noteIndex % scale.notes.length;
  const horizontalOctave = Math.floor(noteIndex / scale.notes.length);
  const verticalOctave = y < 0.35 ? 2 : y < 0.62 ? 1 : 0;
  const octave = Math.min(6, Math.max(2, 2 + horizontalOctave + verticalOctave));
  return { note: `${scale.notes[degree]}${octave}`, octave };
}

export function drumPadForPosition(x: number, y: number) {
  const col = Math.min(2, Math.max(0, Math.floor(x * 3)));
  const row = y < 0.58 ? 0 : 1;
  return drumPads[row * 3 + col];
}
