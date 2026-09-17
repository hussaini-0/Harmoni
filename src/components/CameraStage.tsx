import { Camera, Loader2, TriangleAlert } from 'lucide-react';
import type { InstrumentId, ScaleId, TrackedHand } from '../types';
import { useHandTracker } from '../hooks/useHandTracker';

type Props = {
  instrument: InstrumentId;
  scale: ScaleId;
  showLandmarks: boolean;
  onHands: (hands: TrackedHand[]) => void;
  onStartAudio: () => Promise<void>;
};

export function CameraStage({ instrument, scale, showLandmarks, onHands, onStartAudio }: Props) {
  const { videoRef, canvasRef, start, running, loading, error } = useHandTracker({ instrument, scale, showLandmarks, onHands });

  const handleStart = async () => {
    await onStartAudio();
    await start();
  };

  return (
    <section className="stage-shell">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className={`camera-canvas ${showLandmarks ? '' : 'camera-soft'}`} />
      {!running && (
        <div className="stage-overlay">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/10">
              {loading ? <Loader2 className="animate-spin text-sky-100" /> : <Camera className="text-sky-100" />}
            </div>
            <h2 className="text-2xl font-semibold text-white">Start your camera</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Harmoni tracks both hands locally in your browser and turns pinches into musical notes.</p>
            <button className="primary-button mt-5" type="button" onClick={handleStart} disabled={loading}>
              {loading ? 'Starting...' : 'Start Camera'}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute left-4 right-4 top-4 flex items-start gap-3 rounded-[8px] border border-rose-300/30 bg-rose-950/72 p-4 text-sm text-rose-50 backdrop-blur">
          <TriangleAlert className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
