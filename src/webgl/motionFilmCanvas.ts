// Real-Time 60fps Canvas Motion Video Compositor + Optional Web Audio Soundscape

export interface MotionFilmController {
  setFilm: (imageSrc: string, grade: 'amber' | 'cedar' | 'jasmine') => void;
  setPlaying: (playing: boolean) => void;
  seek: (seconds: number) => void;
  destroy: () => void;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

export function initMotionFilmCanvas(
  canvas: HTMLCanvasElement | null,
  initialImage: string,
  initialGrade: 'amber' | 'cedar' | 'jasmine',
  durationSec: number,
  onTimeUpdate: (sec: number) => void
): MotionFilmController {
  if (!canvas) {
    return {
      setFilm: () => {},
      setPlaying: () => {},
      seek: () => {},
      destroy: () => {},
    };
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      setFilm: () => {},
      setPlaying: () => {},
      seek: () => {},
      destroy: () => {},
    };
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playing = !prefersReduced;
  let currentTime = 0;
  let lastFrameTs = performance.now();
  let grade: 'amber' | 'cedar' | 'jasmine' = initialGrade;
  let rafId = 0;
  let lastReported = -1;

  const img = new Image();
  let imgReady = false;
  img.onload = () => {
    imgReady = true;
  };
  img.src = initialImage;

  const particles: DustParticle[] = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00028,
    vy: -0.00018 - Math.random() * 0.00035,
    r: 1.2 + Math.random() * 3.8,
    alpha: 0.14 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
  }));

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const renderFrame = (now: number) => {
    const dt = Math.min(0.1, (now - lastFrameTs) / 1000);
    lastFrameTs = now;

    if (playing && !prefersReduced) {
      currentTime = (currentTime + dt) % durationSec;
    }

    if (Math.abs(currentTime - lastReported) > 0.08) {
      lastReported = currentTime;
      onTimeUpdate(currentTime);
    }

    resize();
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) {
      rafId = requestAnimationFrame(renderFrame);
      return;
    }

    ctx.clearRect(0, 0, w, h);
    const progress = currentTime / durationSec;
    const smoothWave = Math.sin(progress * Math.PI * 2);

    // 1. Slow-Cinema Ken Burns Pan + Zoom + Handheld Breathing
    if (imgReady && img.naturalWidth > 0) {
      const scaleBase = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const zoom = 1.04 + 0.08 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
      const panX = smoothWave * w * 0.025;
      const panY = Math.cos(progress * Math.PI * 2) * h * 0.015;

      const drawW = img.naturalWidth * scaleBase * zoom;
      const drawH = img.naturalHeight * scaleBase * zoom;
      const drawX = (w - drawW) / 2 + panX;
      const drawY = (h - drawH) / 2 + panY;

      ctx.save();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1E1915';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Anamorphic Fragrance Light Sweep & Volumetric Mist
    const sweepX = w * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2 - 0.5)));
    const sweepY = h * 0.32;
    const grad = ctx.createRadialGradient(sweepX, sweepY, 0, sweepX, sweepY, w * 0.65);

    if (grade === 'amber') {
      grad.addColorStop(0, 'rgba(232, 168, 86, 0.26)');
      grad.addColorStop(0.45, 'rgba(184, 118, 52, 0.10)');
      grad.addColorStop(1, 'rgba(20, 15, 11, 0.35)');
    } else if (grade === 'cedar') {
      grad.addColorStop(0, 'rgba(180, 194, 178, 0.22)');
      grad.addColorStop(0.5, 'rgba(72, 90, 78, 0.12)');
      grad.addColorStop(1, 'rgba(12, 15, 14, 0.42)');
    } else {
      grad.addColorStop(0, 'rgba(246, 232, 214, 0.25)');
      grad.addColorStop(0.5, 'rgba(196, 172, 148, 0.08)');
      grad.addColorStop(1, 'rgba(22, 18, 16, 0.34)');
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 3. Rising Atomized Botanical Mist & Golden Bokeh Particles
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      if (playing && !prefersReduced) {
        pt.x += pt.vx + Math.sin(now * 0.0008 + pt.phase) * 0.00012;
        pt.y += pt.vy;
        if (pt.y < -0.05) {
          pt.y = 1.05;
          pt.x = Math.random();
        }
        if (pt.x < -0.05) pt.x = 1.05;
        if (pt.x > 1.05) pt.x = -0.05;
      }

      const px = pt.x * w;
      const py = pt.y * h;
      const pulse = 0.65 + 0.35 * Math.sin(now * 0.0018 + pt.phase);
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, pt.r * 3.5);
      const tint =
        grade === 'cedar' ? '220, 230, 224' : grade === 'jasmine' ? '255, 246, 232' : '244, 198, 128';
      pGrad.addColorStop(0, `rgba(${tint}, ${(pt.alpha * pulse).toFixed(3)})`);
      pGrad.addColorStop(1, `rgba(${tint}, 0)`);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, pt.r * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Cinema Contrast Scrim for Overlaid Controls & Title Legibility
    const scrim = ctx.createLinearGradient(0, 0, 0, h);
    scrim.addColorStop(0, 'rgba(14, 12, 10, 0.28)');
    scrim.addColorStop(0.45, 'rgba(14, 12, 10, 0.05)');
    scrim.addColorStop(1, 'rgba(14, 12, 10, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);

    rafId = requestAnimationFrame(renderFrame);
  };

  rafId = requestAnimationFrame(renderFrame);

  return {
    setFilm: (imageSrc: string, nextGrade: 'amber' | 'cedar' | 'jasmine') => {
      grade = nextGrade;
      currentTime = 0;
      imgReady = false;
      img.src = imageSrc;
      onTimeUpdate(0);
    },
    setPlaying: (nextPlaying: boolean) => {
      playing = nextPlaying;
      lastFrameTs = performance.now();
    },
    seek: (seconds: number) => {
      currentTime = Math.max(0, Math.min(durationSec, seconds));
      onTimeUpdate(currentTime);
    },
    destroy: () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    },
  };
}

// Gentle Optional Web Audio Atelier Pad (activates only on explicit user click)
export class AtelierSoundscape {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private active = false;

  toggle(): boolean {
    if (this.active) {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }

  private start() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.gain = this.ctx.createGain();
    this.gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.gain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

    filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    // Warm Dmaj9 ambient chord frequencies
    const freqs = [146.83, 220.0, 277.18, 329.63];
    this.oscs = freqs.map((f, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 4, this.ctx!.currentTime);
      osc.connect(filter);
      osc.start();
      return osc;
    });

    this.active = true;
  }

  stop() {
    if (!this.active || !this.ctx || !this.gain) return;
    const now = this.ctx.currentTime;
    try {
      this.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      const oldCtx = this.ctx;
      const oldOscs = this.oscs;
      window.setTimeout(() => {
        oldOscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            // ignore
          }
        });
        oldCtx.close().catch(() => {});
      }, 380);
    } catch {
      // ignore
    }
    this.ctx = null;
    this.gain = null;
    this.oscs = [];
    this.active = false;
  }
}
