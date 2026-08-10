// Oyun ses efektleri — WebAudio ile SENTEZLENİR, ses dosyası gerektirmez.
// Böylece telif/lisans sorunu ve indirme yükü olmadan tutarlı, "cozy" bir
// tıklama/onay/uyarı seti elde edilir. Sesler kısa ve yumuşaktır (sine/triangle
// dalga + hızlı zarf), oyunun sakin tonuna uyar.
//
// Kullanım: `playSfx("click")`. Ses açma/kapama: settingsStore > sfxEnabled.

export type SfxName =
  | "click"      // genel buton
  | "pop"        // olumlu küçük onay (seçim, sekme)
  | "confirm"    // satın alma / onay
  | "cash"       // para tahsilatı
  | "error"      // reddedilen işlem
  | "whoosh";    // panel açılış/kapanış

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;
let volume = 0.35;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    masterGain = context.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(context.destination);
  }
  // Tarayıcı otomatik oynatmayı kilitlemiş olabilir; ilk kullanıcı etkileşiminde açılır.
  if (context.state === "suspended") void context.resume();
  return context;
}

export function setSfxEnabled(next: boolean) {
  enabled = next;
}

export function setSfxVolume(next: number) {
  volume = Math.max(0, Math.min(1, next));
  if (masterGain) masterGain.gain.value = volume;
}

type ToneSpec = {
  type: OscillatorType;
  /** Başlangıç ve bitiş frekansı (Hz) — ikisi farklıysa kayan bir "blup" olur. */
  from: number;
  to: number;
  duration: number;
  gain: number;
  /** Saniye cinsinden gecikme — iki notalı sesler için. */
  delay?: number;
};

const RECIPES: Record<SfxName, ToneSpec[]> = {
  // Kısa, yumuşak, tok bir "tık".
  click: [{ type: "sine", from: 620, to: 480, duration: 0.07, gain: 0.5 }],
  // Yukarı kayan küçük balon sesi.
  pop: [{ type: "sine", from: 420, to: 880, duration: 0.09, gain: 0.55 }],
  // İki notalı olumlu onay.
  confirm: [
    { type: "triangle", from: 540, to: 540, duration: 0.09, gain: 0.45 },
    { type: "triangle", from: 810, to: 810, duration: 0.13, gain: 0.4, delay: 0.08 },
  ],
  // Kasa: parlak çift nota.
  cash: [
    { type: "triangle", from: 940, to: 940, duration: 0.08, gain: 0.4 },
    { type: "triangle", from: 1250, to: 1180, duration: 0.16, gain: 0.34, delay: 0.07 },
  ],
  // Aşağı inen kısa uyarı — sert değil, boğuk.
  error: [{ type: "sine", from: 320, to: 180, duration: 0.16, gain: 0.5 }],
  // Panel geçişi: alçak ve yumuşak.
  whoosh: [{ type: "sine", from: 240, to: 140, duration: 0.14, gain: 0.32 }],
};

// ---------------------------------------------------------------------------
// Motor sesi — sürekli çalan, hıza göre perdesi değişen bir ton.
// İki osilatör (temel + oktav altı) boğuk bir dizel uğultusu verir; alçak geçiren
// filtre cırtlaklığı keser. Hız 0'a inince ses rölantiye düşer, susmaz.
// ---------------------------------------------------------------------------
let engine: {
  osc: OscillatorNode;
  sub: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
} | null = null;

const ENGINE_IDLE_HZ = 46;
const ENGINE_MAX_HZ = 190;
/** Bu hızda motor sesi tavana ulaşır (km/h). */
const ENGINE_FULL_KMH = 55;

function ensureEngine(): boolean {
  const ctx = ensureContext();
  if (!ctx || !masterGain) return false;
  if (engine) return true;

  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  sub.type = "sine";
  filter.type = "lowpass";
  filter.frequency.value = 620;
  filter.Q.value = 0.7;
  gain.gain.value = 0;

  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start();
  sub.start();

  engine = { osc, sub, gain, filter };
  return true;
}

/**
 * Motor sesini günceller. Her karede çağrılabilir (ucuz: yalnızca parametre rampası).
 * @param speedKmh anlık hız (negatif = geri vites, mutlak değeri kullanılır)
 * @param active   false ise ses kısılır (araç kilitli, menü, ses kapalı)
 */
export function updateEngineSound(speedKmh: number, active: boolean) {
  if (!enabled || !active) {
    if (engine) engine.gain.gain.setTargetAtTime(0, engine.gain.context.currentTime, 0.12);
    return;
  }
  if (!ensureEngine() || !engine) return;

  const ctx = engine.gain.context;
  const ratio = Math.min(1, Math.abs(speedKmh) / ENGINE_FULL_KMH);
  const hz = ENGINE_IDLE_HZ + (ENGINE_MAX_HZ - ENGINE_IDLE_HZ) * ratio;

  // setTargetAtTime: ani sıçrama yerine yumuşak geçiş (motor "tırmanıyor" hissi).
  engine.osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.08);
  engine.sub.frequency.setTargetAtTime(hz / 2, ctx.currentTime, 0.08);
  engine.filter.frequency.setTargetAtTime(520 + ratio * 900, ctx.currentTime, 0.12);
  // Rölantide bile duyulur bir taban ses var; hızla birlikte yükselir.
  engine.gain.gain.setTargetAtTime(0.05 + ratio * 0.1, ctx.currentTime, 0.1);
}

export function stopEngineSound() {
  if (!engine) return;
  engine.gain.gain.setTargetAtTime(0, engine.gain.context.currentTime, 0.1);
}

// ---------------------------------------------------------------------------
// Arka plan müziği — SENTEZLENİR, telifsizdir (hazır parça kullanılmaz).
//
// Sakin bir "cozy" doku: yumuşak bir akor pedi + üstünde yavaş, rastgele
// seçilmiş tek notalar. Pentatonik dizi kullanılır; hangi nota gelirse gelsin
// uyumsuz duymaz, bu yüzden sonsuza kadar çalabilir ve tekrar hissi vermez.
// ---------------------------------------------------------------------------

/** A minör pentatonik (Hz) — huzurlu, "yanlış nota" üretmeyen dizi. */
const MUSIC_SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
/** Ped akoru: kök + beşli + oktav. */
const MUSIC_PAD = [110.0, 164.81, 220.0];
const MUSIC_NOTE_MIN_MS = 2600;
const MUSIC_NOTE_MAX_MS = 5200;

let music: { gain: GainNode; pads: OscillatorNode[]; timer: number | null } | null = null;
let musicEnabled = false;
let musicVolume = 0.18;

function scheduleMusicNote() {
  if (!music || !musicEnabled) return;
  const ctx = music.gain.context;

  const freq = MUSIC_SCALE[Math.floor(Math.random() * MUSIC_SCALE.length)];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + 0.02;
  const duration = 2.4 + Math.random() * 1.6;

  osc.type = "sine";
  osc.frequency.value = freq;
  // Yavaş atak + uzun sönüm: nota "belirir ve dağılır", vurmaz.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.16, start + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(music.gain);
  osc.start(start);
  osc.stop(start + duration + 0.1);

  const nextMs = MUSIC_NOTE_MIN_MS + Math.random() * (MUSIC_NOTE_MAX_MS - MUSIC_NOTE_MIN_MS);
  music.timer = window.setTimeout(scheduleMusicNote, nextMs);
}

export function setMusicEnabled(next: boolean) {
  musicEnabled = next;
  if (!next) {
    stopMusic();
    return;
  }
  startMusic();
}

export function setMusicVolume(next: number) {
  musicVolume = Math.max(0, Math.min(1, next));
  if (music) music.gain.gain.setTargetAtTime(musicVolume, music.gain.context.currentTime, 0.4);
}

export function startMusic() {
  if (!musicEnabled || music) return;
  const ctx = ensureContext();
  if (!ctx || !masterGain) return;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(masterGain);

  // Ped: hafif detune edilmiş üçlü — hareketsiz ama "canlı" bir zemin.
  const pads = MUSIC_PAD.map((freq, index) => {
    const osc = ctx.createOscillator();
    const padGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (index - 1) * 6;
    filter.type = "lowpass";
    filter.frequency.value = 900;
    padGain.gain.value = 0.05;
    osc.connect(filter);
    filter.connect(padGain);
    padGain.connect(gain);
    osc.start();
    return osc;
  });

  music = { gain, pads, timer: null };
  gain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 1.2);
  scheduleMusicNote();
}

export function stopMusic() {
  if (!music) return;
  const { gain, pads, timer } = music;
  if (timer !== null) window.clearTimeout(timer);
  gain.gain.setTargetAtTime(0, gain.context.currentTime, 0.5);
  // Sönüm bitince osilatörleri kapat.
  window.setTimeout(() => {
    pads.forEach((osc) => {
      try { osc.stop(); } catch { /* zaten durmuş olabilir */ }
    });
    gain.disconnect();
  }, 1400);
  music = null;
}

export function playSfx(name: SfxName) {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx || !masterGain) return;

  for (const spec of RECIPES[name]) {
    const start = ctx.currentTime + (spec.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.from, start);
    if (spec.to !== spec.from) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.to), start + spec.duration);
    }

    // Hızlı atak + üstel sönüm: tıklama "cozy" kalsın, cırtlak olmasın.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(spec.gain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + spec.duration + 0.02);
  }
}
