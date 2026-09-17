import type { AppSettings } from '../types';

const storageKey = 'harmoni-settings-v1';

export const defaultSettings: AppSettings = {
  selectedInstrument: 'grand-piano',
  selectedScale: 'c-major',
  sustain: false,
  muted: false,
  masterVolume: 0.75,
  orchestraMode: false,
  orchestraLayers: {
    strings: true,
    brass: true,
    bass: true,
    choir: false,
    percussion: true,
  },
  orchestraIntensity: 3,
  showLandmarks: true,
  onboardingSeen: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}
