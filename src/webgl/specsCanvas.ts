// Interactive 3D Rotating Architectural Flacon & Olfactory Orbit Wireframe
export function initSpecsCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let angle = 0;
  const targetSpeed = 0.009;
  let hoverBoost = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onEnter = () => {
    hoverBoost = 0.022;
  };
  const onLeave = () => {
    hoverBoost = 0;
  };

  const parent = canvas.parentElement;
  parent?.addEventListener('pointerenter', onEnter);
  parent?.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const rings = [
    { y: -0.9, r: 0.48 },
    { y: -0.78, r: 0.5 },
    { y: 0.16, r: 0.5 },
    { y: 0.28, r: 0.44 },
    { y: 0.36, r: 0.22 },
    { y: 0.52, r: 0.22 },
    { y: 0.56, r: 0.34 },
    { y: 0.94, r: 0.34 },
  ];

  const draw = () => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const strokeMain = isDark
      ? 'rgba(248, 245, 239, 0.24)'
      : 'rgba(71, 57, 47, 0.24)';
    const strokeAccent = isDark
      ? 'rgba(185, 155, 107, 0.88)'
      : 'rgba(130, 29, 48, 0.88)';
    const strokeOrb = isDark
      ? 'rgba(185, 155, 107, 0.35)'
      : 'rgba(185, 155, 107, 0.55)';

    const cx = w * 0.68;
    const cy = h * 0.48;
    const scaleY = Math.min(w, h) * 0.36;
    const scaleX = scaleY * 0.84;

    if (!prefersReduced) {
      angle += targetSpeed + hoverBoost;
    }

    ctx.lineWidth = Math.max(1.2, w / 440);

    for (let o = 0; o < 2; o++) {
      ctx.save();
      ctx.translate(cx, cy - scaleY * 0.15);
      ctx.rotate(o === 0 ? 0.26 : -0.22);
      ctx.beginPath();
      ctx.strokeStyle = strokeOrb;
      ctx.setLineDash([4, 6]);
      ctx.ellipse(0, 0, scaleX * (0.9 + o * 0.22), scaleY * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]);

    for (let i = 0; i < rings.length; i++) {
      const { y, r } = rings[i];
      ctx.beginPath();
      ctx.strokeStyle = i === 4 || i === 5 ? strokeAccent : strokeMain;
      const rx = r * scaleX;
      const ry = r * scaleX * 0.22;
      const py = cy - y * scaleY;
      ctx.ellipse(cx, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const meridians = 12;
    for (let m = 0; m < meridians; m++) {
      const theta = angle + (m * Math.PI * 2) / meridians;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      ctx.beginPath();
      ctx.strokeStyle = m % 3 === 0 ? strokeAccent : strokeMain;
      for (let i = 0; i < rings.length; i++) {
        const { y, r } = rings[i];
        const px = cx + cosT * r * scaleX;
        const py = cy - y * scaleY + sinT * r * scaleX * 0.22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    if (!prefersReduced) {
      rafId = requestAnimationFrame(draw);
    }
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    parent?.removeEventListener('pointerenter', onEnter);
    parent?.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
  };
}
