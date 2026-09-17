import * as Tone from 'tone';
import { drumPadForPosition, instrumentById, scales } from '../data/music';
import type { AppSettings, InstrumentId, OrchestraLayer, TrackedHand } from '../types';

type Voice = Tone.PolySynth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;

export class MusicEngine {
  private lead: Tone.PolySynth<Tone.Synth> | Tone.PolySynth<Tone.AMSynth> | Tone.PolySynth<Tone.FMSynth>;
  private bass: Tone.PolySynth<Tone.FMSynth>;
  private strings: Tone.PolySynth<Tone.Synth>;
  private brass: Tone.PolySynth<Tone.Synth>;
  private choir: Tone.PolySynth<Tone.AMSynth>;
  private kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 8 }).toDestination();
  private snare = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).toDestination();
  private metal = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.18, release: 0.05 } }).toDestination();
  private master = new Tone.Gain(0.75).toDestination();
  private active = new Map<string, string>();
  private lastDrumHit = new Map<string, number>();
  private currentInstrument: InstrumentId = 'grand-piano';
  private disposed = false;

  constructor() {
    this.lead = this.createLead('grand-piano');
    this.bass = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 0.5,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.55, release: 0.7 },
    }).connect(this.master);
    this.strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.45, release: 1.4 },
    }).connect(this.master);
    this.brass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.05, decay: 0.15, sustain: 0.28, release: 0.5 },
    }).connect(this.master);
    this.choir = new Tone.PolySynth(Tone.AMSynth, {
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.4, release: 1.6 },
    }).connect(this.master);
    [this.kick, this.snare, this.metal].forEach((voice) => voice.connect(this.master));
  }

  async start() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    Tone.Transport.bpm.value = 88;
    Tone.Transport.start();
  }

  setSettings(settings: AppSettings) {
    this.master.gain.rampTo(settings.muted ? 0 : settings.masterVolume, 0.05);
    if (settings.selectedInstrument !== this.currentInstrument) {
      this.releaseAll(false);
      this.lead.dispose();
      this.lead = this.createLead(settings.selectedInstrument);
      this.currentInstrument = settings.selectedInstrument;
    }
  }

  updateHands(hands: TrackedHand[], settings: AppSettings) {
    if (this.disposed) return;
    this.setSettings(settings);
    const seen = new Set<string>();
    hands.forEach((hand) => {
      if (!hand.note) return;
      seen.add(hand.id);
      if (settings.selectedInstrument === 'drum-kit') {
        if (hand.isPinching || hand.velocity > 0.42) {
          this.triggerDrum(hand);
        }
        return;
      }
      this.updateLeadHand(hand, settings);
    });

    [...this.active.keys()].forEach((handId) => {
      if (!seen.has(handId)) this.releaseHand(handId, settings.sustain);
    });
  }

  dispose() {
    this.disposed = true;
    this.releaseAll(false);
    [this.lead, this.bass, this.strings, this.brass, this.choir, this.kick, this.snare, this.metal, this.master].forEach(
      (voice) => voice.dispose(),
    );
  }

  private createLead(instrument: InstrumentId) {
    const definition = instrumentById[instrument];
    const presets = {
      'grand-piano': { oscillator: { type: 'triangle8' }, envelope: { attack: 0.005, decay: 0.35, sustain: 0.15, release: 0.7 } },
      violin: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.12, decay: 0.1, sustain: 0.65, release: 0.8 } },
      cello: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.18, decay: 0.15, sustain: 0.72, release: 1 } },
      flute: { oscillator: { type: 'sine' }, envelope: { attack: 0.08, decay: 0.15, sustain: 0.55, release: 0.55 } },
      'electric-guitar': { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.18, sustain: 0.38, release: 0.45 } },
      'synth-lead': { oscillator: { type: 'fatsawtooth' }, envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.4 } },
      bass: { oscillator: { type: 'fmsquare' }, envelope: { attack: 0.01, decay: 0.12, sustain: 0.55, release: 0.45 } },
      'drum-kit': { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.4 } },
    } as const;
    const config = presets[instrument] as ConstructorParameters<typeof Tone.Synth>[0];

    const Synth = definition.family === 'synth' || definition.family === 'wind' ? Tone.AMSynth : Tone.Synth;
    return new Tone.PolySynth(Synth as typeof Tone.Synth, config).connect(this.master);
  }

  private updateLeadHand(hand: TrackedHand, settings: AppSettings) {
    const current = this.active.get(hand.id);
    const expression = Math.min(1, Math.max(0.18, 0.35 + hand.velocity * 0.9));
    const note = hand.note;
    if (hand.isPinching && note) {
      if (current !== note) {
        if (current) this.lead.triggerRelease(current);
        this.lead.triggerAttack(note, Tone.now(), expression);
        this.active.set(hand.id, note);
        this.triggerOrchestra(note, settings, expression);
      }
    } else if (current) {
      this.releaseHand(hand.id, settings.sustain);
    }
  }

  private releaseHand(handId: string, sustain: boolean) {
    const note = this.active.get(handId);
    if (!note) return;
    this.lead.triggerRelease(note, Tone.now() + (sustain ? 0.45 : 0));
    this.active.delete(handId);
  }

  private releaseAll(sustain: boolean) {
    [...this.active.keys()].forEach((handId) => this.releaseHand(handId, sustain));
    this.strings.releaseAll();
    this.brass.releaseAll();
    this.bass.releaseAll();
    this.choir.releaseAll();
  }

  private triggerDrum(hand: TrackedHand) {
    const now = Tone.now();
    const previous = this.lastDrumHit.get(hand.id) ?? 0;
    if (now - previous < 0.16) return;
    const pad = drumPadForPosition(hand.x, hand.y);
    const velocity = Math.min(1, Math.max(0.35, 0.45 + hand.velocity));
    if (pad.name === 'Kick') this.kick.triggerAttackRelease('C1', '8n', now, velocity);
    else if (pad.name === 'Snare' || pad.name === 'Clap') this.snare.triggerAttackRelease('16n', now, velocity);
    else this.metal.triggerAttackRelease(pad.key, '16n', now, velocity * 0.75);
    this.lastDrumHit.set(hand.id, now);
  }

  private triggerOrchestra(leadNote: string, settings: AppSettings, expression: number) {
    if (!settings.orchestraMode) return;
    const intensity = settings.orchestraIntensity / 5;
    const activeLayers = Object.entries(settings.orchestraLayers)
      .filter(([, enabled]) => enabled)
      .slice(0, Math.max(1, settings.orchestraIntensity)) as [OrchestraLayer, boolean][];
    const root = scales[settings.selectedScale].root;
    const rootNote = `${root}2`;
    const third = Tone.Frequency(leadNote).transpose(4).toNote();
    const fifth = Tone.Frequency(leadNote).transpose(7).toNote();
    activeLayers.forEach(([layer]) => {
      if (layer === 'strings') this.strings.triggerAttackRelease([leadNote, fifth], '1n', Tone.now(), 0.22 * intensity);
      if (layer === 'brass') this.brass.triggerAttackRelease([third, fifth], '8n', Tone.now() + 0.02, 0.18 * expression * intensity);
      if (layer === 'bass') this.bass.triggerAttackRelease(rootNote, '2n', Tone.now(), 0.28 * intensity);
      if (layer === 'choir') this.choir.triggerAttackRelease([leadNote, third], '1m', Tone.now(), 0.15 * intensity);
      if (layer === 'percussion') this.metal.triggerAttackRelease('G4', '32n', Tone.now() + 0.08, 0.1 * intensity);
    });
  }
}
