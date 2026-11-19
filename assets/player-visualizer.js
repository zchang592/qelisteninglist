export function createVisualizer(canvas, audio) {
  const graphics = canvas.getContext('2d');
  if (!graphics) return { prepare() {} };

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let context;
  let analyser;
  let spectrum;
  let initializing = false;
  let visible = true;
  let frame = 0;

  function paint(active) {
    const { width, height } = canvas;
    graphics.clearRect(0, 0, width, height);
    if (active) analyser.getByteFrequencyData(spectrum);
    const bands = 44;
    const bandWidth = width / bands;
    const barWidth = bandWidth * .28;
    graphics.fillStyle = '#d6e7cd';
    for (let band = 0; band < bands; band++) {
      const bin = Math.floor(1 + 155 * (band / bands) ** 1.75);
      const level = active ? spectrum[bin] / 255 : 0;
      const barHeight = Math.max(barWidth, level ** 1.5 * height * .74);
      graphics.globalAlpha = active ? .26 + level * .64 : .32;
      graphics.fillRect(band * bandWidth + (bandWidth - barWidth) / 2, (height - barHeight) / 2, barWidth, barHeight);
    }
    graphics.globalAlpha = 1;
  }

  function animate() {
    if (visible && context?.state === 'running' && !audio.paused && !audio.ended && !audio.error && !document.hidden && !reducedMotion.matches) {
      paint(true);
      frame = requestAnimationFrame(animate);
    } else {
      frame = 0;
      paint(false);
    }
  }

  function refresh() {
    cancelAnimationFrame(frame);
    animate();
  }

  async function prepare() {
    if (!AudioContext || initializing || (reducedMotion.matches && !context)) return;
    if (context) {
      if (context.state !== 'running') context.resume().then(refresh).catch(() => {});
      return;
    }
    initializing = true;
    let nextContext;
    try {
      nextContext = new AudioContext();
      // Keep native playback connected until the visualizer can use a running audio context.
      await nextContext.resume();
      const nextAnalyser = nextContext.createAnalyser();
      nextAnalyser.fftSize = 1024;
      nextAnalyser.connect(nextContext.destination);
      nextContext.createMediaElementSource(audio).connect(nextAnalyser);
      context = nextContext;
      analyser = nextAnalyser;
      spectrum = new Uint8Array(analyser.frequencyBinCount);
      refresh();
    } catch {
      nextContext?.close().catch(() => {});
    } finally {
      initializing = false;
    }
  }

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    refresh();
  }

  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }).observe(canvas);
  for (const event of ['playing', 'pause', 'ended', 'error', 'emptied']) audio.addEventListener(event, refresh);
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener?.('change', refresh);

  return { prepare };
}
