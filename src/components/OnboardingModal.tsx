import { Hand, Music, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function OnboardingModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/78 p-4 backdrop-blur-xl">
      <div className="max-w-xl rounded-[8px] border border-white/14 bg-slate-950/88 p-6 shadow-glow">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-amber-200/80">Welcome to</p>
            <h2 className="mt-1 text-3xl font-semibold text-white">Harmoni</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close help">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 text-sm leading-6 text-slate-200">
          <div className="flex gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
            <Hand className="mt-1 shrink-0 text-sky-200" size={20} />
            <p>Press <strong>Start Camera</strong>, allow webcam access, then hold either or both hands in view.</p>
          </div>
          <div className="flex gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
            <Music className="mt-1 shrink-0 text-amber-200" size={20} />
            <p>Pinch thumb and index finger to play. Left-to-right chooses notes; vertical movement changes register. Both hands play the selected instrument together.</p>
          </div>
          <p className="text-slate-300">Switch scales, enable sustain, or turn on Orchestra Mode to conduct harmony layers that follow your lead notes.</p>
        </div>
        <button className="primary-button mt-6 w-full" type="button" onClick={onClose}>
          Begin
        </button>
      </div>
    </div>
  );
}
