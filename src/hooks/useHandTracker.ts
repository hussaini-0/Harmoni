import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, HAND_CONNECTIONS, type Results } from '@mediapipe/hands';
import { drumPadForPosition, noteForPosition } from '../data/music';
import type { InstrumentId, Landmark, ScaleId, TrackedHand } from '../types';

type TrackerOptions = {
  instrument: InstrumentId;
  scale: ScaleId;
  showLandmarks: boolean;
  onHands: (hands: TrackedHand[]) => void;
};

type HandMemory = {
  pinching: boolean;
  x: number;
  y: number;
  velocity: number;
};

export function useHandTracker({ instrument, scale, showLandmarks, onHands }: TrackerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const memoryRef = useRef(new Map<string, HandMemory>());
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback((results: Results, trackedHands: TrackedHand[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    drawPlayableZone(ctx, canvas.width, canvas.height, instrument);
    trackedHands.forEach((hand) => drawHand(ctx, hand, canvas.width, canvas.height, showLandmarks));
  }, [instrument, showLandmarks]);

  useEffect(() => {
    const hands = handsRef.current;
    if (!hands) return;
    hands.onResults((results) => {
      const tracked = normalizeResults(results, instrument, scale, memoryRef.current);
      draw(results, tracked);
      onHands(tracked);
    });
  }, [draw, instrument, onHands, scale]);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.68,
        minTrackingConfidence: 0.62,
      });
      hands.onResults((results) => {
        const tracked = normalizeResults(results, instrument, scale, memoryRef.current);
        draw(results, tracked);
        onHands(tracked);
      });
      handsRef.current = hands;

      const video = videoRef.current;
      if (!video) throw new Error('Camera surface is not ready.');
      const camera = new Camera(video, {
        onFrame: async () => {
          if (video.readyState >= 2) await hands.send({ image: video });
        },
        width: 1280,
        height: 720,
      });
      cameraRef.current = camera;
      await camera.start();
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to access the camera.');
    } finally {
      setLoading(false);
    }
  }, [draw, instrument, onHands, scale]);

  useEffect(() => {
    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, []);

  return { videoRef, canvasRef, start, running, loading, error };
}

function normalizeResults(
  results: Results,
  instrument: InstrumentId,
  scale: ScaleId,
  memory: Map<string, HandMemory>,
): TrackedHand[] {
  const now = performance.now();
  const multiLandmarks = results.multiHandLandmarks ?? [];
  return multiLandmarks.map((landmarks, index) => {
    const handedness = results.multiHandedness?.[index]?.label === 'Left' ? 'Left' : 'Right';
    const id = handedness;
    const normalized = landmarks as Landmark[];
    const indexTip = normalized[8];
    const thumbTip = normalized[4];
    const palm = normalized[9];
    const x = 1 - palm.x;
    const y = palm.y;
    const previous = memory.get(id);
    const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const strength = Math.max(0, Math.min(1, 1 - distance / 0.095));
    const wasPinching = previous?.pinching ?? false;
    const isPinching = wasPinching ? distance < 0.083 : distance < 0.065;
    const velocity = previous ? Math.hypot(x - previous.x, y - previous.y) * 12 + previous.velocity * 0.45 : 0;
    const musical = instrument === 'drum-kit' ? drumPadForPosition(x, y).name : noteForPosition(x, y, scale).note;
    const octave = instrument === 'drum-kit' ? 0 : Number.parseInt(musical.charAt(musical.length - 1) || '4', 10);
    memory.set(id, { pinching: isPinching, x, y, velocity });
    return {
      id,
      handedness,
      landmarks: normalized,
      pinchStrength: strength,
      isPinching,
      note: musical,
      octave,
      velocity,
      x,
      y,
      lastSeen: now,
    };
  });
}

function drawPlayableZone(ctx: CanvasRenderingContext2D, width: number, height: number, instrument: InstrumentId) {
  const top = height * 0.47;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(0, top, width, height - top);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  const columns = instrument === 'drum-kit' ? 3 : 8;
  const rows = instrument === 'drum-kit' ? 2 : 3;
  for (let i = 1; i < columns; i += 1) {
    ctx.beginPath();
    ctx.moveTo((width / columns) * i, top);
    ctx.lineTo((width / columns) * i, height);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, top + ((height - top) / rows) * i);
    ctx.lineTo(width, top + ((height - top) / rows) * i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, hand: TrackedHand, width: number, height: number, showLandmarks: boolean) {
  ctx.save();
  ctx.fillStyle = hand.isPinching ? '#f8d57e' : '#93c5fd';
  ctx.strokeStyle = hand.isPinching ? 'rgba(248,213,126,0.8)' : 'rgba(147,197,253,0.62)';
  ctx.lineWidth = 3;
  if (showLandmarks) {
    HAND_CONNECTIONS.forEach(([a, b]) => {
      const start = hand.landmarks[a];
      const end = hand.landmarks[b];
      ctx.beginPath();
      ctx.moveTo((1 - start.x) * width, start.y * height);
      ctx.lineTo((1 - end.x) * width, end.y * height);
      ctx.stroke();
    });
    hand.landmarks.forEach((landmark, index) => {
      const radius = index === 4 || index === 8 ? 5 : 3;
      ctx.beginPath();
      ctx.arc((1 - landmark.x) * width, landmark.y * height, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const labelX = hand.x * width;
  const labelY = Math.max(32, hand.y * height - 34);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  roundedRect(ctx, labelX - 34, labelY - 18, 68, 30, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 14px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hand.note ?? '', labelX, labelY + 4);
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
}
