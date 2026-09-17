# Harmoni

Harmoni is a browser-based gesture music app. It uses webcam hand tracking to let both hands play the currently selected instrument with pinch gestures, scale-aware notes, and an optional orchestra accompaniment.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL, press **Start Camera**, then allow camera access. The browser may require HTTPS or localhost for webcam permissions.

## Build

```bash
npm run build
```

## Controls

- Select an instrument, scale, sustain mode, and master volume.
- Pinch thumb and index finger together over a labeled note box to play its note.
- Move left to right for lower to higher notes, and move upward for a higher register.
- Turn on Orchestra Mode to add harmony layers that follow the lead notes.
- For Drum Kit, move either hand over a labeled pad in the lower camera area and strike downward, then lift to reset for the next hit. No pinch is needed.
