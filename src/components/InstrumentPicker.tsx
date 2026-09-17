import { instruments } from '../data/music';
import type { InstrumentId } from '../types';

type Props = {
  value: InstrumentId;
  onChange: (instrument: InstrumentId) => void;
};

export function InstrumentPicker({ value, onChange }: Props) {
  return (
    <section className="panel">
      <h2 className="panel-title">Instrument</h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {instruments.map((instrument) => (
          <button
            type="button"
            key={instrument.id}
            onClick={() => onChange(instrument.id)}
            className={`instrument-button ${value === instrument.id ? 'instrument-button-active' : ''}`}
            style={{ '--accent': instrument.color } as React.CSSProperties}
          >
            <span className="instrument-swatch" />
            <span>{instrument.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
