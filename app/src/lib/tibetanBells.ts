/** Tibetan singing bowl ambience + gentle 40Hz layer for comfort mode */

let bellCtx: AudioContext | null = null;
let bellMaster: GainNode | null = null;
let bellLoopId: ReturnType<typeof setInterval> | null = null;
let bellNodes: AudioNode[] = [];
let bellBinauralStarted = false;

const BOWL_FREQS = [108, 216, 324, 432, 540, 648, 756];

function getBellContext(): AudioContext {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!bellCtx) bellCtx = new Ctx();
  return bellCtx;
}

function strike(ctx: AudioContext, master: GainNode, freq: number, when: number, amp: number) {
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, when);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.756, when);

  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 5.404, when);

  const revLen = ctx.sampleRate * 3;
  const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = revBuf.getChannelData(ch);
    for (let i = 0; i < revLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 2.5) * 0.4;
    }
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = revBuf;

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(amp, when);
  g1.gain.exponentialRampToValueAtTime(0.0001, when + 5.5);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(amp * 0.35, when);
  g2.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);

  const g3 = ctx.createGain();
  g3.gain.setValueAtTime(amp * 0.12, when);
  g3.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);

  osc1.connect(g1); g1.connect(reverb);
  osc2.connect(g2); g2.connect(reverb);
  osc3.connect(g3); g3.connect(reverb);
  reverb.connect(master);

  osc1.start(when); osc1.stop(when + 6);
  osc2.start(when); osc2.stop(when + 4);
  osc3.start(when); osc3.stop(when + 2.5);
  bellNodes.push(osc1, osc2, osc3, g1, g2, g3, reverb);
}

function startBinauralLayer(ctx: AudioContext, master: GainNode) {
  if (bellBinauralStarted) return;
  bellBinauralStarted = true;

  const binauralOsc = ctx.createOscillator();
  binauralOsc.type = 'sine';
  binauralOsc.frequency.setValueAtTime(220, ctx.currentTime);
  const binauralMod = ctx.createOscillator();
  binauralMod.type = 'sine';
  binauralMod.frequency.setValueAtTime(40, ctx.currentTime);
  const binauralGain = ctx.createGain();
  binauralGain.gain.setValueAtTime(0.14, ctx.currentTime);
  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(0.05, ctx.currentTime);
  binauralMod.connect(modGain);
  modGain.connect(binauralOsc.frequency);
  binauralOsc.connect(binauralGain);
  binauralGain.connect(master);
  binauralOsc.start();
  binauralMod.start();
  bellNodes.push(binauralOsc, binauralMod, binauralGain, modGain);
}

function scheduleStrike() {
  if (!bellCtx || !bellMaster) return;
  const ctx = bellCtx;
  const when = ctx.currentTime + 0.15;
  const freq = BOWL_FREQS[Math.floor(Math.random() * BOWL_FREQS.length)];
  strike(ctx, bellMaster, freq, when, 0.5);
  if (Math.random() > 0.5) {
    const harm = BOWL_FREQS[Math.floor(Math.random() * BOWL_FREQS.length)];
    strike(ctx, bellMaster, harm, when + 0.14, 0.22);
  }
}

export async function resumeTibetanBells(volumeTarget = 0.52): Promise<void> {
  try {
    const ctx = getBellContext();
    await ctx.resume();

    if (!bellMaster) {
      bellMaster = ctx.createGain();
      bellMaster.connect(ctx.destination);
      startBinauralLayer(ctx, bellMaster);
    }

    bellMaster.gain.cancelScheduledValues(ctx.currentTime);
    bellMaster.gain.setValueAtTime(bellMaster.gain.value, ctx.currentTime);
    bellMaster.gain.linearRampToValueAtTime(volumeTarget, ctx.currentTime + 1.2);

    if (!bellLoopId) {
      for (let i = 0; i < 3; i++) scheduleStrike();
      bellLoopId = setInterval(scheduleStrike, 3800);
    }
  } catch (err) {
    console.warn('[TibetanBells] resume failed:', err);
  }
}

export function startTibetanBells(volumeTarget = 0.52): () => void {
  void resumeTibetanBells(volumeTarget);
  return stopTibetanBells;
}

export function stopTibetanBells(): void {
  if (bellLoopId) {
    clearInterval(bellLoopId);
    bellLoopId = null;
  }
  if (bellCtx && bellMaster) {
    try {
      bellMaster.gain.linearRampToValueAtTime(0.0001, bellCtx.currentTime + 0.8);
    } catch { /* ignore */ }
  }
  setTimeout(() => {
    bellNodes.forEach((n) => {
      try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* stopped */ }
    });
    bellNodes = [];
    bellBinauralStarted = false;
    if (bellCtx) {
      try { void bellCtx.close(); } catch { /* ignore */ }
      bellCtx = null;
      bellMaster = null;
    }
  }, 900);
}
