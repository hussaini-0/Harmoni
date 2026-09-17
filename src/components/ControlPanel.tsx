import { HelpCircle, Radio, Volume2, VolumeX } from 'lucide-react';
import { orchestraLayerLabels, scales } from '../data/music';
import type { AppSettings, OrchestraLayer, ScaleId } from '../types';

type Props = {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onHelp: () => void;
};

const layerIds = Object.keys(orchestraLayerLabels) as OrchestraLayer[];

export function ControlPanel({ settings, onChange, onHelp }: Props) {
  const patch = (partial: Partial<AppSettings>) => onChange({ ...settings, ...partial });
  const patchLayer = (layer: OrchestraLayer, enabled: boolean) =>
    patch({ orchestraLayers: { ...settings.orchestraLayers, [layer]: enabled } });

  return (
    <section className="panel control-panel">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Controls</h2>
        <button className="icon-button" type="button" onClick={onHelp} aria-label="Open help">
          <HelpCircle size={18} />
        </button>
      </div>

      <label className="field">
        <span>Scale</span>
        <select value={settings.selectedScale} onChange={(event) => patch({ selectedScale: event.target.value as ScaleId })}>
          {Object.entries(scales).map(([id, scale]) => (
            <option key={id} value={id}>
              {scale.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button className={`toggle-button ${settings.muted ? 'toggle-on' : ''}`} type="button" onClick={() => patch({ muted: !settings.muted })}>
          {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          Mute
        </button>
        <button className={`toggle-button ${settings.sustain ? 'toggle-on' : ''}`} type="button" onClick={() => patch({ sustain: !settings.sustain })}>
          <Radio size={16} />
          Sustain
        </button>
      </div>

      <label className="field">
        <span>Master Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.masterVolume}
          onChange={(event) => patch({ masterVolume: Number(event.target.value) })}
        />
      </label>

      <label className="switch-row">
        <span>Show Hand Landmarks</span>
        <input
          type="checkbox"
          checked={settings.showLandmarks}
          onChange={(event) => patch({ showLandmarks: event.target.checked })}
        />
      </label>

      <label className="switch-row">
        <span>Orchestra Mode</span>
        <input
          type="checkbox"
          checked={settings.orchestraMode}
          onChange={(event) => patch({ orchestraMode: event.target.checked })}
        />
      </label>

      <div className={`orchestra ${settings.orchestraMode ? 'opacity-100' : 'opacity-50'}`}>
        <label className="field">
          <span>Orchestra Intensity</span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={settings.orchestraIntensity}
            disabled={!settings.orchestraMode}
            onChange={(event) => patch({ orchestraIntensity: Number(event.target.value) })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {layerIds.map((layer) => (
            <label key={layer} className="layer-toggle">
              <input
                type="checkbox"
                disabled={!settings.orchestraMode}
                checked={settings.orchestraLayers[layer]}
                onChange={(event) => patchLayer(layer, event.target.checked)}
              />
              <span>{orchestraLayerLabels[layer]}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
