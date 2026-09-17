import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, CircleHelp, Sparkles } from 'lucide-react';
import { CameraStage } from './components/CameraStage';
import { ControlPanel } from './components/ControlPanel';
import { InstrumentPicker } from './components/InstrumentPicker';
import { OnboardingModal } from './components/OnboardingModal';
import { MusicEngine } from './engines/MusicEngine';
import { instrumentById } from './data/music';
import type { AppSettings, TrackedHand } from './types';
import { loadSettings, saveSettings } from './utils/settings';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [helpOpen, setHelpOpen] = useState(!settings.onboardingSeen);
  const engineRef = useRef<MusicEngine | null>(null);
  const activeInstrument = instrumentById[settings.selectedInstrument];

  useEffect(() => saveSettings(settings), [settings]);

  useEffect(() => {
    engineRef.current = new MusicEngine();
    return () => engineRef.current?.dispose();
  }, []);

  useEffect(() => {
    engineRef.current?.setSettings(settings);
  }, [settings]);

  const handleHands = useCallback(
    (trackedHands: TrackedHand[]) => {
      setHands(trackedHands);
      engineRef.current?.updateHands(trackedHands, settings);
    },
    [settings],
  );

  const startAudio = useCallback(async () => {
    await engineRef.current?.start();
  }, []);

  const closeHelp = () => {
    setHelpOpen(false);
    setSettings((current) => ({ ...current, onboardingSeen: true }));
  };

  const handSummary = useMemo(
    () => hands.map((hand) => `${hand.handedness}: ${hand.note}${settings.selectedInstrument === 'drum-kit' ? (hand.drumHit ? ' hit' : '') : (hand.isPinching ? ' playing' : '')}`).join('  /  '),
    [hands, settings.selectedInstrument],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="app-gradient" />
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-[8px] border border-white/15 bg-white/10 shadow-glow">
                <AudioLines className="text-amber-200" size={23} />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">Harmoni</h1>
                <p className="mt-1 text-slate-300">Play music with your hands.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="toggle-button px-3" type="button" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={17} />
              How to use
            </button>
            <div className="status-pill">
              <Sparkles size={16} />
              <span>{activeInstrument.name}</span>
              {hands.length > 0 && <span className="hidden text-slate-300 md:inline">{handSummary}</span>}
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)_310px]">
          <InstrumentPicker
            value={settings.selectedInstrument}
            onChange={(selectedInstrument) => setSettings((current) => ({ ...current, selectedInstrument }))}
          />
          <CameraStage
            instrument={settings.selectedInstrument}
            scale={settings.selectedScale}
            showLandmarks={settings.showLandmarks}
            onHands={handleHands}
            onStartAudio={startAudio}
          />
          <ControlPanel settings={settings} onChange={setSettings} onHelp={() => setHelpOpen(true)} />
        </div>
      </div>
      <OnboardingModal open={helpOpen} onClose={closeHelp} />
    </main>
  );
}
