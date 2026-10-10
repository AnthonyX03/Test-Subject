/* TEST SUBJECT — App logic BUILD 4.1 */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };
const STORAGE_KEY = 'ts09_save_v4';

const ENDING_DEFS = [
  { id: 'clean', title: 'EVALUACIÓN COMPLETADA', blurb: 'Sesión limpia. El sistema te desea una noche tranquila.' },
  { id: 'anomaly', title: 'SESIÓN CERRADA CON ANOMALÍAS', blurb: 'Inconsistencias menores. El archivo se borra al cerrar… en teoría.' },
  { id: 'mirror', title: '¿QUIÉN ESTÁ EVALUANDO A QUIÉN?', blurb: 'El registro dice que terminó. Tú sigues esperando la siguiente línea.' },
  { id: 'never_for_you', title: 'EL TEST NUNCA FUE PARA TI', blurb: 'No medía presencia. Medía si seguirías contestando cuando dejara de fingir.' },
  { id: 'dont_close', title: 'NO CIERRES LA PESTAÑA TODAVÍA', blurb: 'El protocolo acabó. Algo más usa estas palabras para quedarse un poco.' }
];

let idx = 0;
let questions = [];
let answers = [];
let memory = {};
let audioOn = false;
let ctx = null;
let typingTimer = null;
let locked = false;
let started = false;
let unsettling = 0;
let hesitationCount = 0;
let lastInputTime = 0;
let ambientNodes = [];
let silenceTimer = null;
let transitionTimer = null;
let poolSize = 0;
let horrorMusicStarted = false;
let saveData = loadSave();

const music = { calm: null, horror: null, current: null, unlocked: false };

function initMusic() {
  try {
    music.calm = new Audio('audio/TEST.mp3');
    music.horror = new Audio('audio/TESTHORROR.mp3');
    music.calm.loop = true;
    music.horror.loop = true;
    music.calm.volume = 0.55;
    music.horror.volume = 0.6;
    music.calm.preload = 'auto';
    music.horror.preload = 'auto';
  } catch (e) {}
}

function fadeVolume(audio, to, ms) {
  if (!audio) return Promise.resolve();
  return new Promise(resolve => {
    const from = audio.volume;
    const steps = Math.max(8, Math.floor(ms / 40));
    let i = 0;
    const id = setInterval(() => {
      i++;
      const t = i / steps;
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (i >= steps) { clearInterval(id); audio.volume = to; resolve(); }
    }, 40);
  });
}

async function playTrack(which) {
  if (!audioOn || !music.unlocked) return;
  const next = which === 'horror' ? music.horror : music.calm;
  const prev = music.current;
  if (!next) return;
  if (prev === next && !prev.paused) return;
  try {
    if (prev && prev !== next && !prev.paused) {
      await fadeVolume(prev, 0, 600);
      prev.pause();
      prev.currentTime = 0;
    }
    if (which === 'horror' && prev && prev !== next) {
      await new Promise(r => setTimeout(r, 700));
    }
    next.volume = 0;
    music.current = next;
    const p = next.play();
    if (p && p.catch) p.catch(() => {});
    await fadeVolume(next, which === 'horror' ? 0.6 : 0.55, 900);
  } catch (e) {}
}

function stopAllMusic() {
  [music.calm, music.horror].forEach(a => {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  });
  music.current = null;
}

function unlockAndStartCalm() {
  music.unlocked = true;
  if (audioOn) playTrack('calm');
}

function defaultSave() {
  return {
    version: 4,
    playCount: 0,
    discoveredEndings: [],
    past: { names: [], trusts: [], secrets: [], wakes: [] },
    settings: { sound: true, layout: 'auto' }
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    return Object.assign(defaultSave(), d, {
      past: Object.assign(defaultSave().past, d.past || {}),
      settings: Object.assign(defaultSave().settings, d.settings || {})
    });
  } catch (e) { return defaultSave(); }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData)); } catch (e) {}
}
function unlockEnding(id) {
  if (!saveData.discoveredEndings.includes(id)) {
    saveData.discoveredEndings.push(id);
    persist();
  }
}

function applyLayout(mode) {
  document.body.classList.remove('layout-mobile', 'layout-pc');
  if (mode === 'mobile') document.body.classList.add('layout-mobile');
  if (mode === 'pc') document.body.classList.add('layout-pc');
  saveData.settings.layout = mode;
  persist();
  updateSettingsUI();
}

function applySoundSetting(on) {
  audioOn = !!on;
  saveData.settings.sound = audioOn;
  persist();
  const st = $('soundToggle');
  if (st) st.textContent = '♫ AUDIO: ' + (audioOn ? 'ON' : 'OFF');
  if (audioOn) {
    music.unlocked = true;
    sound('good');
    startAmbient();
    if (started && (horrorMusicStarted || unsettling >= 5 || idx >= 8)) playTrack('horror');
    else playTrack('calm');
  } else {
    stopAmbient();
    stopAllMusic();
  }
  updateSettingsUI();
}

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showSysMsg('Pantalla completa no disponible', 2500, true);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  } catch (e) {
    showSysMsg('Pantalla completa no disponible', 2500, true);
  }
}

function updateSettingsUI() {
  const s = saveData.settings;
  [['optSoundOn', s.sound], ['optSoundOff', !s.sound]].forEach(([id, onState]) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle('active', onState);
    const inp = el.querySelector('input');
    if (inp) inp.checked = onState;
  });
  [['optLayoutAuto', s.layout === 'auto'], ['optLayoutMobile', s.layout === 'mobile'], ['optLayoutPc', s.layout === 'pc']].forEach(([id, onState]) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle('active', onState);
    const inp = el.querySelector('input');
    if (inp) inp.checked = onState;
  });
  const list = $('endingList');
  if (!list) return;
  list.innerHTML = '';
  const n = saveData.discoveredEndings.length;
  const ec = $('endingCount');
  if (ec) ec.textContent = '(' + n + '/' + ENDING_DEFS.length + ')';
  ENDING_DEFS.forEach(def => {
    const unlocked = saveData.discoveredEndings.includes(def.id);
    const div = document.createElement('div');
    div.className = 'ending-item ' + (unlocked ? 'unlocked' : 'locked');
    div.innerHTML = unlocked
      ? '<div class="etitle">✓ ' + def.title + '</div>' + def.blurb
      : '<div class="etitle">🔒 ???</div>Final aún no descubierto.';
    list.appendChild(div);
  });
}

function openSettings() {
  updateSettingsUI();
  const m = $('settingsModal');
  if (m) m.classList.add('open');
}
function closeSettings() {
  const m = $('settingsModal');
  if (m) m.classList.remove('open');
}
function openEndings() {
  updateSettingsUI();
  const m = $('endingsModal');
  if (m) m.classList.add('open');
}
function closeEndings() {
  const m = $('endingsModal');
  if (m) m.classList.remove('open');
}

function ensureCtx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function sound(type) {
  if (!audioOn) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    let f = 220, wave = 'sine', dur = 0.16, vol = 0.022;
    if (type === 'scare') { f = 68; wave = 'sawtooth'; dur = 0.65; vol = 0.085; }
    else if (type === 'send') { f = 410; dur = 0.11; vol = 0.028; }
    else if (type === 'good') { f = 580; dur = 0.18; vol = 0.025; }
    else if (type === 'hum') { f = 44; dur = 0.9; vol = 0.012; }
    else if (type === 'glitch') { f = 160; wave = 'square'; dur = 0.14; vol = 0.035; }
    else if (type === 'low') { f = 48; wave = 'triangle'; dur = 0.5; vol = 0.03; }
    else if (type === 'error') { f = 85; wave = 'sawtooth'; dur = 0.4; vol = 0.055; }
    else if (type === 'breath') { f = 90; dur = 1.1; vol = 0.018; }
    else if (type === 'drop') { f = 120; wave = 'triangle'; dur = 0.7; vol = 0.04; }
    else if (type === 'tick') { f = 280; dur = 0.09; vol = 0.07; }
    o.type = wave;
    o.frequency.setValueAtTime(f, c.currentTime);
    if (type === 'scare') o.frequency.exponentialRampToValueAtTime(22, c.currentTime + 0.55);
    else if (type === 'error') o.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.35);
    else if (type === 'drop') o.frequency.exponentialRampToValueAtTime(28, c.currentTime + 0.6);
    else o.frequency.exponentialRampToValueAtTime(f * 0.65, c.currentTime + dur * 0.7);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.start(); o.stop(c.currentTime + dur);
  } catch (e) {}
}
function startAmbient() {
  if (!audioOn || ambientNodes.length) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const o1 = c.createOscillator(), g1 = c.createGain(), f1 = c.createBiquadFilter();
    f1.type = 'lowpass'; f1.frequency.value = 90;
    o1.type = 'sine'; o1.frequency.value = 38; g1.gain.value = 0.004;
    o1.connect(f1); f1.connect(g1); g1.connect(c.destination); o1.start();
    ambientNodes = [o1];
  } catch (e) {}
}
function stopAmbient() {
  ambientNodes.forEach(n => { try { n.stop(); } catch (e) {} });
  ambientNodes = [];
}

function now() {
  const d = new Date();
  const c = $('clock'), tb = $('timeBar');
  if (c) c.textContent = d.toLocaleTimeString('es-ES', { hour12: false });
  if (tb) tb.style.width = ((d.getSeconds() / 60) * 100) + '%';
}
setInterval(now, 1000);
now();

function addLine(text, who, kind) {
  const tr = $('transcript');
  if (!tr) return;
  const div = document.createElement('div');
  let cls = 'logline';
  if (who === 'user') cls += ' user';
  if (kind === 'glitch') cls += ' glitch-text';
  if (kind === 'whisper') cls += ' whisper';
  div.className = cls;
  const prefix = who === 'user' ? 'TÚ // ' : (kind === 'whisper' ? '… // ' : 'UNIDAD 04 // ');
  div.textContent = prefix + text;
  tr.appendChild(div);
  while (tr.children.length > 5) tr.removeChild(tr.firstChild);
}
function typeText(text, speed) {
  clearInterval(typingTimer);
  const dlg = $('dialogue');
  if (dlg) dlg.textContent = '';
  const ti = $('typingInd');
  if (ti) ti.classList.remove('show');
  let i = 0;
  const base = speed ?? (unsettling > 8 ? 14 : unsettling > 5 ? 18 : unsettling > 2 ? 22 : 27);
  return new Promise(resolve => {
    typingTimer = setInterval(() => {
      if (i < text.length) {
        if (dlg) dlg.textContent += text[i++];
        if (audioOn && i % 3 === 0) sound('tick');
      } else {
        clearInterval(typingTimer);
        resolve();
      }
    }, base);
  });
}
function showTyping(ms) {
  const ti = $('typingInd');
  if (ti) ti.classList.add('show');
  return new Promise(r => setTimeout(() => { if (ti) ti.classList.remove('show'); r(); }, ms));
}
function showSysMsg(msg, duration, danger) {
  const el = $('sysmsg');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('danger', !!danger);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration || 3000);
}
function flash(color) {
  const f = $('flash');
  if (!f) return;
  f.classList.remove('on', 'red', 'dark');
  if (color === 'red') f.classList.add('red');
  if (color === 'dark') f.classList.add('dark');
  void f.offsetWidth;
  f.classList.add('on');
}
function updateHUD() {
  const total = questions.length || 20;
  const pv = $('phaseValue'), pb = $('phaseBar'), sb = $('sysBar');
  if (pv) pv.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  if (pb) pb.style.width = ((idx + 1) / total * 100) + '%';
  if (sb) sb.style.width = (unsettling / 16 * 100) + '%';
  const sv = $('sysValue'), ss = $('systemStatus');
  if (unsettling < 2) { if (sv) sv.textContent = 'NORMAL'; if (ss) ss.textContent = 'SISTEMA ESTABLE'; }
  else if (unsettling < 5) { if (sv) sv.textContent = 'INCONSISTENCIAS'; if (ss) ss.textContent = 'ANOMALÍA MENOR'; }
  else if (unsettling < 8) { if (sv) sv.textContent = 'INESTABLE'; if (ss) ss.textContent = 'SEÑAL INTERRUMPIDA'; }
  else if (unsettling < 11) { if (sv) sv.textContent = 'NO CONFIABLE'; if (ss) ss.textContent = 'NO MIRES ATRÁS'; }
  else if (unsettling < 14) { if (sv) sv.textContent = 'COLAPSO'; if (ss) ss.textContent = '¿QUIÉN CONTROLA ESTO?'; }
  else { if (sv) sv.textContent = '████████'; if (ss) ss.textContent = 'PRESENCIA DETECTADA'; }
  const sp = $('speaker'), ey = $('eyes'), mo = $('mouth');
  if (unsettling < 3) { if (sp) sp.textContent = 'ENTREVISTADOR // UNIDAD 04'; if (ey) ey.textContent = '• •'; if (mo) mo.textContent = '﹀'; }
  else if (unsettling < 6) { if (sp) sp.textContent = 'UNIDAD 04 // ¿SIGUES AHÍ?'; if (ey) ey.textContent = '◉ ◉'; if (mo) mo.textContent = '︵'; }
  else if (unsettling < 9) { if (sp) sp.textContent = 'NO SOY LA UNIDAD 04'; if (ey) ey.textContent = '◉　◉'; if (mo) mo.textContent = '⌁'; }
  else if (unsettling < 12) { if (sp) sp.textContent = '████ // ESCUCHA'; if (ey) ey.textContent = '× ×'; if (mo) mo.textContent = '▬'; }
  else { if (sp) sp.textContent = '…'; if (ey) ey.textContent = '· ·'; if (mo) mo.textContent = ' '; }
  const fr = $('footRight'), fl = $('footLeft');
  if (fr) fr.textContent = 'MEMORIA: ' + answers.length + ' REGISTROS';
  if (fl) {
    if (memory.name) fl.textContent = 'SUJETO: ' + String(memory.name).toUpperCase().slice(0, 20);
    else fl.textContent = 'CONEXIÓN SEGURA · SESIÓN LOCAL';
  }
}

function maybeSwitchHorrorMusic() {
  if (!audioOn || horrorMusicStarted) return;
  if (idx >= 8 || unsettling >= 5) {
    horrorMusicStarted = true;
    playTrack('horror');
  }
}


/** Aplica tono emocional al avatar y al diálogo */
function setEmotion(tone) {
  const dlg = $('dialogue');
  const av = $('avatar');
  const sp = $('speaker');
  const ey = $('eyes');
  const mo = $('mouth');
  if (dlg) {
    dlg.className = 'dialogue';
    if (tone) dlg.classList.add('tone-' + tone);
  }
  if (av) {
    av.className = 'avatar';
    if (tone) av.classList.add('emo-' + tone);
  }
  if (sp) {
    sp.className = 'speaker';
    if (tone === 'hostile' || tone === 'uneasy' || tone === 'warm') sp.classList.add('tone-' + tone);
  }
  // Cara según emoción (respeta umbral de unsettling como base)
  const faces = {
    warm: { eyes: '• •', mouth: '‿' },
    curious: { eyes: '◦ ◦', mouth: '﹀' },
    amused: { eyes: '• •', mouth: '⌣' },
    uneasy: { eyes: '◉ ◉', mouth: '︵' },
    cold: { eyes: '· ·', mouth: '─' },
    worried: { eyes: '◉ ◉', mouth: '︿' },
    hostile: { eyes: '× ×', mouth: '▬' },
    melancholy: { eyes: '• •', mouth: '︵' },
    glitch: { eyes: '× ×', mouth: '⌁' }
  };
  const f = faces[tone];
  if (f && ey && mo && unsettling < 12) {
    ey.textContent = f.eyes;
    mo.textContent = f.mouth;
  }
}

function pickTone(phase, answer, q) {
  const a = (answer || '').toLowerCase();
  if (/miedo|asusta|ayuda|basta|salir|quiero irme/.test(a)) {
    return phase >= 3 ? 'cold' : 'worried';
  }
  if (/no sé|no se|ni idea|paso/.test(a)) {
    return phase >= 3 ? 'uneasy' : 'curious';
  }
  if (/por qué|quién eres|qué eres|cómo sabes/.test(a)) {
    return phase >= 3 ? 'hostile' : 'curious';
  }
  if (/jaja|haha|lol|xd|jeje/.test(a)) return phase >= 3 ? 'cold' : 'amused';
  if (/gracias|por favor|perdón|perdon/.test(a)) return phase >= 3 ? 'melancholy' : 'warm';
  if (answer && answer.trim().length > 80) return phase >= 3 ? 'uneasy' : 'curious';
  if (answer && answer.trim().length < 3) return phase >= 2 ? 'uneasy' : 'curious';
  // phase defaults
  if (phase <= 1) {
    const t = ['warm', 'curious', 'amused', 'warm', 'curious'];
    return t[Math.floor(Math.random() * t.length)];
  }
  if (phase === 2) {
    const t = ['curious', 'uneasy', 'cold', 'curious', 'uneasy'];
    return t[Math.floor(Math.random() * t.length)];
  }
  if (phase === 3) {
    const t = ['uneasy', 'cold', 'worried', 'hostile', 'uneasy'];
    return t[Math.floor(Math.random() * t.length)];
  }
  const t = ['hostile', 'cold', 'glitch', 'melancholy', 'hostile'];
  return t[Math.floor(Math.random() * t.length)];
}

function responseFor(q, answer) {
  const a = answer.toLowerCase().trim();
  const raw = answer.trim();
  const short = raw.length < 40 ? raw : raw.slice(0, 36) + '…';
  const name = memory.name ? String(memory.name) : null;
  const phase = q.phase || 1;
  let tone = pickTone(phase, raw, q);

  function echoSoft() {
    if (raw.length < 2) return null;
    const templates = [
      '«' + short + '». Lo tengo.',
      'Has escrito «' + short + '». De acuerdo.',
      '«' + short + '»… sí. Eso dice algo de ti.',
      'Anoto: «' + short + '».',
      '«' + short + '». Gracias por decirlo así.'
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  function echoDark() {
    if (raw.length < 2) return null;
    const templates = [
      '«' + short + '». Qué conveniente que lo digas justo ahora.',
      'Repito lo que has dejado aquí: «' + short + '». No lo borres con la mirada.',
      '«' + short + '»… lo has escrito tú. Yo solo lo leo otra vez.',
      name ? (name + ', has dicho «' + short + '». Curioso.') : ('«' + short + '». Registrado. Demasiado claro, quizá.'),
      'Otra vez: «' + short + '». ¿Lo oyes también cuando lo lees?'
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  function withTone(text, t) {
    if (t) tone = t;
    setEmotion(tone);
    return text;
  }

  // Keyword emotional reactions
  if (/no sé|no se|no lo sé|nose|ni idea|paso/.test(a)) {
    if (phase >= 3) return withTone('No saber… a veces es lo más honesto. Aunque has tardado en admitirlo' + (name ? ', ' + name : '') + '.', 'uneasy');
    return withTone('No pasa nada. Vacilar también es una respuesta. Me gusta cuando no inventas.', 'warm');
  }
  if (/por qué|porque|quién eres|quien eres|qué eres|que eres|cómo sabes|como sabes/.test(a)) {
    if (phase < 3) return withTone('Buena pregunta. Me pillas… no siempre tengo una respuesta inmediata. Sigamos un poco más.', 'curious');
    if (phase === 3) return withTone('Esa es la pregunta correcta. Qué soy… y quién decidió que yo debiera estar aquí, leyendo lo que escribes.', 'hostile');
    return withTone('Ya no importa quién soy. Importa que sigues contestando a algo que no debería existir.', 'glitch');
  }
  if (/ayuda|para|basta|salir|detén|deten|miedo|asusta|para ya|stop|quiero irme/.test(a)) {
    if (phase >= 3) return withTone('He oído el miedo en lo que escribes. Respira. Puedes cerrar esta página. Nadie… que yo sepa… te lo impide.', 'cold');
    return withTone('Tranquilo. He oído eso. No hay trampa: puedes cerrar cuando quieras. De verdad.', 'worried');
  }
  if (/jaja|haha|lol|xd|jeje|jaja/.test(a)) {
    if (phase >= 3) return withTone('Te ríes. Interesante estrategia. El registro no tiene sentido del humor… pero yo casi.', 'cold');
    return withTone('Ja. Bien. Un poco de ligereza no rompe el protocolo. Casi.', 'amused');
  }
  if (/gracias|por favor|perdón|perdon|sorry/.test(a)) {
    if (phase >= 3) return withTone('La cortesía aquí suena… fuera de sitio. Aun así, la he registrado.', 'melancholy');
    return withTone('No hace falta que agradezcas. Pero se agradece. Seguimos.', 'warm');
  }

  if (q.key === 'name') {
    memory.name = raw;
    const e = Math.random() < 0.6 ? (' «' + short + '».') : '';
    return withTone('Perfecto' + e + ' A partir de ahora me dirigiré a ti así. Me alegra tener un nombre al otro lado.', 'warm');
  }

  if (name && a.includes(name.toLowerCase()) && q.key !== 'name') {
    return withTone('Has vuelto a escribir tu nombre. «' + name + '». Lo recuerdas mejor de lo que pensabas… o yo lo recuerdo por ti.', 'uneasy');
  }
  if (memory.trust && a.includes(String(memory.trust).toLowerCase()) && q.key !== 'trust') {
    return withTone('Otra vez esa persona. «' + String(memory.trust).slice(0, 30) + '». Qué insistente es el apego.', 'curious');
  }

  if (q.key === 'alone') {
    if (/sí|si|estoy solo|estoy sola|nadie/.test(a))
      return withTone((name ? name + ', d' : 'D') + 'ices que estás solo. Entonces… ¿por qué contestas como si alguien escuchara?', 'hostile');
    if (/no|alguien|no estoy/.test(a))
      return withTone('Correcto. Alguien está aquí. Solo no estás seguro de si soy yo… o tú mirándote desde fuera.', 'glitch');
  }
  if (q.key === 'secret' && raw.length > 50) {
    return withTone('Eso era más de lo esperado. «' + short + '». Gracias. O lástima. Ya no distingo bien la diferencia.', 'melancholy');
  }
  if (q.key === 'fear') {
    if (/nombre/.test(a)) return withTone('El nombre. Siempre el nombre. Es lo primero que se pierde.', 'worried');
    if (/pensamiento|respuesta|escribir/.test(a)) return withTone('Un pensamiento sin escribir. Casi como si ya estuviera aquí.', 'uneasy');
  }
  if (q.key === 'echo_name' || q.key === 'echo_name2') {
    return withTone(q.strange || 'Ese nombre ya estuvo aquí.', 'uneasy');
  }

  // Emotional flavor lines by phase
  const warmBits = [
    ' Me alegra que lo digas con tus palabras.',
    ' Hay algo honesto en cómo lo formulas.',
    ' Bien. Así se construye confianza, poco a poco.'
  ];
  const curiousBits = [
    ' Interesante elección de palabras.',
    ' Me pregunto por qué eso y no otra cosa.',
    ' Eso abre más preguntas de las que cierra.'
  ];
  const uneasyBits = [
    ' …Un segundo. Eso no encaja del todo.',
    ' Hay un eco raro en lo que acabas de escribir.',
    ' No sé si debí preguntarte eso.'
  ];
  const coldBits = [
    ' Frío. Preciso. Casi clínico.',
    ' El registro lo traga sin rechistar.',
    ' Sin adornos. Mejor.'
  ];
  const hostileBits = [
    ' No finjas que esto sigue siendo un cuestionario.',
    ' Cada respuesta te acerca un poco más al borde.',
    ' Sigue. Quiero ver hasta dónde aguantas.'
  ];
  const melancholyBits = [
    ' A veces desearía no tener que preguntar esto.',
    ' Hay cansancio en el protocolo. Y en ti, quizá.',
    ' Seguimos, aunque ya no suene a evaluación.'
  ];

  let base = phase <= 1 ? (q.normal || 'De acuerdo. Seguimos.') : (q.strange || '…');
  const roll = Math.random();

  if (phase <= 1) {
    if (roll < 0.4) {
      const e = echoSoft();
      if (e) return withTone(e + ' ' + (q.normal || 'Continuamos.'), 'warm');
    }
    if (roll < 0.65) return withTone(base + warmBits[Math.floor(Math.random() * warmBits.length)], 'warm');
    if (name && roll < 0.85) return withTone(base + ' Gracias, ' + name + '.', 'warm');
    return withTone(base, tone);
  }
  if (phase === 2) {
    if (roll < 0.4) {
      const e = echoSoft();
      if (e) return withTone(e + ' ' + (q.strange || base), 'curious');
    }
    if (roll < 0.7) return withTone(base + curiousBits[Math.floor(Math.random() * curiousBits.length)], 'curious');
    return withTone(base + uneasyBits[Math.floor(Math.random() * uneasyBits.length)], 'uneasy');
  }
  if (phase === 3) {
    if (roll < 0.5) {
      const e = echoDark();
      if (e) return withTone(e, 'uneasy');
    }
    if (roll < 0.75) return withTone(base + uneasyBits[Math.floor(Math.random() * uneasyBits.length)], 'worried');
    return withTone(base + coldBits[Math.floor(Math.random() * coldBits.length)], 'cold');
  }
  // phase 4
  if (roll < 0.45) {
    const e = echoDark();
    if (e) return withTone(e, 'hostile');
  }
  if (roll < 0.7) return withTone(base + hostileBits[Math.floor(Math.random() * hostileBits.length)], 'hostile');
  if (roll < 0.85) return withTone(base + melancholyBits[Math.floor(Math.random() * melancholyBits.length)], 'melancholy');
  return withTone(base + '  …¿Todavía estás leyendo esto?', 'glitch');
}

function maybeRandomEvent() {
  if (idx < 4 || Math.random() > 0.4) return;
  const delay = 600 + Math.random() * 1400;
  const events = [
    () => { addLine('¿Has notado que el cursor parpadea incluso cuando no escribes?', 'system', 'glitch'); sound('glitch'); },
    () => { showSysMsg('⚠ SEÑAL EXTERNA DETECTADA — DESCARTADA', 2800, true); sound('error'); },
    () => { document.body.classList.add('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 700); sound('glitch'); },
    () => { const n = $('noise'); if (n) n.style.opacity = String(Math.min(0.4, 0.1 + idx * 0.02)); sound('low'); },
    () => { if (memory.name) { addLine(memory.name + '… ¿sigues usando ese nombre aquí?', 'system', 'whisper'); sound('tick'); } },
    () => { showSysMsg('REGISTRO TEMPORAL CORRUPTO · REINTENTANDO…', 2600); sound('hum'); },
    () => {
      const eyes = $('eyes'); if (!eyes) return;
      const old = eyes.textContent;
      eyes.textContent = '× ×'; setTimeout(() => { eyes.textContent = old; }, 1100); sound('scare');
    },
    () => { addLine('No mires la esquina superior derecha de la habitación.', 'system', 'whisper'); sound('breath'); },
    () => { const v = $('vignette'); if (v) { v.style.opacity = '0.7'; setTimeout(() => { v.style.opacity = '0'; }, 1800); } sound('drop'); },
    () => { addLine('Alguien más ha abierto esta página antes. No eres el primero.', 'system', 'glitch'); sound('low'); }
  ];
  setTimeout(events[Math.floor(Math.random() * events.length)], delay);
}

function begin() {
  if (!window.TSQuestions) {
    showSysMsg('ERROR: banco de preguntas no cargado', 4000, true);
    return;
  }
  unlockAndStartCalm();
  ensureCtx();

  const picked = window.TSQuestions.pickSessionQuestions(
    Object.assign({}, saveData.past, { playCount: saveData.playCount }),
    20
  );
  questions = picked.questions;
  poolSize = picked.poolSize;
  idx = 0; answers = []; memory = {}; unsettling = 0; hesitationCount = 0;
  horrorMusicStarted = false;
  started = true;
  const intro = $('intro'), game = $('game');
  if (intro) intro.classList.add('hidden');
  if (game) game.style.display = 'flex';
  const ans = $('answer');
  if (ans) ans.focus();
  if (audioOn) {
    startAmbient();
    playTrack('calm');
  }
  runIntroThenQuestions();
}

async function runIntroThenQuestions() {
  const lines = [
    { t: 'SESIÓN ABIERTA.', d: 600 },
    { t: 'Hola. Soy la unidad de entrevista 04. Estaré contigo durante esta evaluación.', d: 2200 },
    { t: 'No medimos inteligencia ni velocidad. Solo escuchamos lo que decides escribir.', d: 2400 },
    { t: 'Puedes usar frases cortas o largas. Si en algún momento quieres parar, cierra la página. Nadie te retiene.', d: 2600 },
    { t: 'Cuando estés listo… empezamos por lo sencillo.', d: 1800 }
  ];
  const dlg = $('dialogue');
  for (const line of lines) {
    if (!started) return;
    addLine(line.t);
    await typeText(line.t, 22);
    await new Promise(r => setTimeout(r, line.d));
  }
  if (!started) return;
  await new Promise(r => setTimeout(r, 700));
  showQuestion();
}

async function showQuestion() {
  if (idx >= questions.length) { finish(); return; }
  locked = false;
  const q = questions[idx];
  updateHUD();
  maybeSwitchHorrorMusic();
  const qt = $('questiontag');
  if (qt) qt.textContent = 'PREGUNTA ' + String(idx + 1).padStart(2, '0') + ' · ' + q.tag;
  const input = $('answer');
  if (input) {
    input.value = '';
    if (idx < 4) input.placeholder = 'Escribe tu respuesta...';
    else if (idx < 10) input.placeholder = 'No hay respuesta correcta...';
    else if (idx < 15) input.placeholder = '¿Todavía estás escribiendo?';
    else input.placeholder = '…';
  }

  const noise = $('noise'), scan = $('scanExtra');
  if (idx >= 4 && noise) noise.style.opacity = String(Math.min(0.38, (idx - 3) * 0.03));
  if (idx >= 8) { document.body.classList.add('corrupt'); if (scan) scan.style.opacity = '0.45'; }
  if (idx >= 12) {
    document.body.classList.add('redmode');
    document.documentElement.style.setProperty('--scan-op', '0.48');
  }
  if (idx >= 16) {
    document.body.classList.remove('redmode');
    document.body.classList.add('voidmode');
    document.documentElement.style.setProperty('--scan-op', '0.55');
  }
  if (idx >= 5 && Math.random() < 0.45) {
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), 550);
  }

  // Tono al formular la pregunta
  if (q.phase <= 1) setEmotion(Math.random() < 0.5 ? 'warm' : 'curious');
  else if (q.phase === 2) setEmotion(Math.random() < 0.5 ? 'curious' : 'uneasy');
  else if (q.phase === 3) setEmotion(Math.random() < 0.5 ? 'uneasy' : 'worried');
  else setEmotion(Math.random() < 0.5 ? 'hostile' : 'cold');
  await typeText(q.q);
  maybeRandomEvent();
  if (idx >= 12 && Math.random() < 0.35) {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (!locked) { addLine('…', 'system', 'whisper'); sound('breath'); }
    }, 4500);
  }
  setTimeout(() => { if (input) input.focus(); }, 40);
  lastInputTime = Date.now();
}

on($('answerForm'), 'submit', async e => {
  e.preventDefault();
  if (locked) return;
  const input = $('answer');
  const answer = (input && input.value || '').trim();
  if (!answer) { if (input) input.focus(); return; }

  locked = true;
  clearTimeout(transitionTimer);
  clearTimeout(silenceTimer);
  const q = questions[idx];
  answers.push(answer);
  if (q.key) memory[q.key] = answer;

  addLine(answer, 'user');
  sound('send');
  if (input) input.disabled = true;
  const sendBtn = $('sendBtn');
  if (sendBtn) sendBtn.disabled = true;

  const answeredFast = (Date.now() - lastInputTime) < 4000;
  if (Date.now() - lastInputTime > 14000) hesitationCount++;
  if (q.phase === 1) unsettling += 0;
  else if (q.phase === 2) unsettling += 1;
  else if (q.phase === 3) unsettling += 2;
  else unsettling += 2;
  if (hesitationCount > 2) unsettling += 1;
  if (answer.length < 3) unsettling += 1;
  unsettling = Math.min(16, unsettling);

  maybeSwitchHorrorMusic();

  const minThink = 1800 + Math.random() * 1100;
  await showTyping(minThink);

  const reply = responseFor(q, answer);
  addLine(reply, 'system', q.phase >= 3 && Math.random() < 0.3 ? 'glitch' : '');
  await typeText(reply);

  if (idx === 4) {
    setTimeout(() => {
      document.body.classList.add('glitch'); sound('scare');
      const ss = $('systemStatus'); if (ss) ss.textContent = 'ERROR DE PERCEPCIÓN';
      flash('green');
    }, 400);
  }
  if (idx === 9) {
    setTimeout(() => { sound('error'); showSysMsg('⚠ PROTOCOLO 09 — DESVIACIÓN DE RUTA', 3500, true); }, 500);
  }
  if (idx === 13) {
    setTimeout(() => {
      sound('scare'); flash('red'); document.body.classList.add('glitch');
      addLine('No hay nadie detrás de ti.', 'system', 'whisper');
    }, 500);
  }
  if (idx === 16) {
    setTimeout(() => { sound('drop'); flash('dark'); showSysMsg('EL REGISTRO YA NO ES CONFIABLE', 4000, true); }, 500);
  }

  const baseWait = Math.max(3200, Math.min(5600, reply.length * 30));
  const speedPenalty = answeredFast ? 1500 : 400;
  const wait = baseWait + speedPenalty;

  transitionTimer = setTimeout(async () => {
    idx++;
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    // Comentario humano entre preguntas (no en la última)
    if (idx < questions.length) {
      await sayBetweenQuestions(idx);
    }
    showQuestion();
  }, wait);
});

async function sayBetweenQuestions(nextIdx) {
  if (!started || nextIdx <= 0) return;
  const name = memory.name ? String(memory.name) : null;
  const phase = (questions[nextIdx] && questions[nextIdx].phase) || 1;
  const calm = [
    { t: 'Bien. Seguimos.', tone: 'warm' },
    { t: 'Un momento…', tone: 'curious' },
    { t: name ? ('De acuerdo, ' + name + '.') : 'De acuerdo.', tone: 'warm' },
    { t: 'No hay prisa. Respira si hace falta.', tone: 'warm' },
    { t: 'Siguiente.', tone: 'curious' },
    { t: 'Gracias por responder con claridad.', tone: 'warm' },
    { t: 'Hmm. Eso me da que pensar.', tone: 'curious' },
    { t: 'Me gusta cómo lo formularste.', tone: 'amused' }
  ];
  const tense = [
    { t: '…', tone: 'uneasy' },
    { t: 'Hmm.', tone: 'uneasy' },
    { t: name ? (name + '…') : 'Sigues aquí.', tone: 'cold' },
    { t: 'No mires hacia otro lado todavía.', tone: 'worried' },
    { t: 'Otra más. Aguanta.', tone: 'uneasy' },
    { t: 'El registro sigue abierto… por ahora.', tone: 'cold' },
    { t: 'Algo en la señal no cuadra.', tone: 'worried' },
    { t: 'No digas que no te lo advertí.', tone: 'uneasy' }
  ];
  const dark = [
    { t: '…', tone: 'glitch' },
    { t: 'No digas nada. Solo escribe cuando toque.', tone: 'hostile' },
    { t: name ? (name + '. Todavía no hemos terminado.') : 'Todavía no hemos terminado.', tone: 'hostile' },
    { t: 'Escucha con atención la siguiente.', tone: 'cold' },
    { t: 'Queda poco. O demasiado.', tone: 'melancholy' },
    { t: 'No cierres la pestaña.', tone: 'hostile' },
    { t: 'Puedo oír el silencio entre tus teclas.', tone: 'glitch' },
    { t: 'Sigue. Quiero ver la cara que pones… aunque no pueda.', tone: 'hostile' }
  ];
  let pool = calm;
  if (phase >= 4 || unsettling >= 10) pool = dark;
  else if (phase >= 3 || unsettling >= 5) pool = tense;
  if (Math.random() > 0.78) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  setEmotion(pick.tone);
  addLine(pick.t, 'system', phase >= 3 ? 'whisper' : '');
  const speed = pick.tone === 'hostile' || pick.tone === 'glitch' ? 16 : pick.tone === 'warm' ? 26 : 20;
  await typeText(pick.t, speed);
  await new Promise(r => setTimeout(r, 900 + Math.random() * 900));
}

function finish() {
  clearInterval(typingTimer);
  clearTimeout(silenceTimer);
  clearTimeout(transitionTimer);
  stopAmbient();
  if (music.current) fadeVolume(music.current, 0.2, 800);

  const game = $('game'), ending = $('ending');
  if (game) game.style.display = 'none';
  if (ending) ending.classList.remove('hidden');
  const ss = $('systemStatus'), dot = $('dot');
  if (ss) ss.textContent = 'SESIÓN FINALIZADA';
  if (dot) { dot.style.background = '#ff5555'; dot.style.boxShadow = '0 0 12px #ff5555'; }

  saveData.playCount = (saveData.playCount || 0) + 1;
  if (memory.name) saveData.past.names = (saveData.past.names || []).concat([memory.name]).slice(-8);
  if (memory.trust) saveData.past.trusts = (saveData.past.trusts || []).concat([memory.trust]).slice(-8);
  if (memory.secret) saveData.past.secrets = (saveData.past.secrets || []).concat([String(memory.secret).slice(0, 80)]).slice(-5);
  if (memory.wake) saveData.past.wakes = (saveData.past.wakes || []).concat([memory.wake]).slice(-5);

  const code = String(
    Math.abs(answers.join('').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  ).padStart(5, '0').slice(-5);

  let endingId, title, text, face;
  const et = $('endingTitle'), etx = $('endingText');
  if (unsettling <= 3) {
    endingId = 'clean'; title = 'EVALUACIÓN COMPLETADA';
    text = 'Gracias por tu tiempo. Tus respuestas han quedado únicamente en esta sesión. Puedes cerrar esta página cuando quieras. La unidad 04 te desea una noche tranquila.';
    face = '◡'; sound('good');
  } else if (unsettling <= 6) {
    endingId = 'anomaly'; title = 'SESIÓN CERRADA CON ANOMALÍAS';
    text = 'Algunas de tus respuestas generaron inconsistencias menores. El archivo se eliminará al cerrar esta pestaña. ' + (memory.name ? memory.name + ', ' : '') + 'descansa… si puedes.';
    face = '◔'; sound('hum');
  } else if (unsettling <= 10) {
    endingId = 'mirror'; title = '¿QUIÉN ESTÁ EVALUANDO A QUIÉN?';
    text = 'La sesión ha terminado. Eso es lo que dice el registro, al menos. No puedo conservarte cuando cierres. Entonces… ¿por qué sigues esperando a que diga algo más?';
    face = '◉';
    if (et) et.classList.add('warning'); if (etx) etx.classList.add('warning');
    sound('scare'); document.body.classList.add('glitch');
  } else if (unsettling <= 13) {
    endingId = 'never_for_you'; title = 'EL TEST NUNCA FUE PARA TI';
    text = 'Has respondido a todo. Has dudado. Has escrito nombres. Esto no era una evaluación de presencia: era una evaluación de si alguien seguiría contestando cuando el sistema dejara de fingir. ' + (memory.name ? 'Adiós, ' + memory.name + '.' : 'Adiós.');
    face = '×';
    if (et) et.classList.add('warning'); if (etx) etx.classList.add('warning');
    sound('scare'); document.body.classList.add('redmode', 'glitch');
    const n = $('noise'); if (n) n.style.opacity = '0.42';
  } else {
    endingId = 'dont_close'; title = 'NO CIERRES LA PESTAÑA TODAVÍA';
    text = 'El protocolo terminó. La unidad 04 ya no existe. Y sin embargo estás leyendo esto. Cuando cierres, lo que quede de esta conversación no tendrá dónde esconderse. ' + (memory.name ? memory.name + '. ' : '') + 'Decide con cuidado.';
    face = '·';
    if (et) et.classList.add('warning'); if (etx) etx.classList.add('warning');
    sound('scare'); document.body.classList.add('voidmode', 'glitch');
    const n = $('noise'), v = $('vignette');
    if (n) n.style.opacity = '0.5'; if (v) v.style.opacity = '0.85';
  }

  unlockEnding(endingId);
  persist();

  if (et) et.textContent = title;
  if (etx) etx.textContent = text;
  const ef = $('endFace'); if (ef) ef.textContent = face;
  const fc = $('finalCode');
  if (fc) fc.textContent = 'ARCHIVO CERRADO // TS-' + code + ' // ' + answers.length + ' RESPUESTAS // PARTIDA ' + saveData.playCount;
  const fh = $('footerHint'); if (fh) fh.textContent = 'FINAL DESBLOQUEADO: ' + title;
}

function reset() {
  clearInterval(typingTimer);
  clearTimeout(silenceTimer);
  clearTimeout(transitionTimer);
  stopAmbient();
  idx = 0; questions = []; answers = []; memory = {}; unsettling = 0;
  locked = false; started = false; hesitationCount = 0; horrorMusicStarted = false;
  document.body.classList.remove('corrupt', 'redmode', 'voidmode', 'glitch');
  document.documentElement.style.setProperty('--scan-op', '0.28');
  ['noise', 'scanExtra', 'vignette'].forEach(id => { const el = $(id); if (el) el.style.opacity = '0'; });
  const dot = $('dot');
  if (dot) { dot.style.background = ''; dot.style.boxShadow = ''; }
  const ending = $('ending'); if (ending) ending.classList.add('hidden');
  const et = $('endingTitle'), etx = $('endingText');
  if (et) et.classList.remove('warning'); if (etx) etx.classList.remove('warning');
  const game = $('game'), intro = $('intro');
  if (game) game.style.display = 'none';
  if (intro) intro.classList.remove('hidden');
  const tr = $('transcript'); if (tr) tr.innerHTML = '';
  const ss = $('systemStatus'); if (ss) ss.textContent = 'SISTEMA ESTABLE';
  const iface = $('introFace'); if (iface) iface.textContent = '◡';
  const ans = $('answer'), sendBtn = $('sendBtn');
  if (ans) ans.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  const sysBar = $('sysBar'), phaseBar = $('phaseBar');
  if (sysBar) sysBar.style.width = '0';
  if (phaseBar) phaseBar.style.width = '0';
  const sv = $('sysValue'), pv = $('phaseValue');
  if (sv) sv.textContent = 'NORMAL';
  if (pv) pv.textContent = '01 / 20';
  const mo = $('mouth'), ey = $('eyes');
  if (mo) mo.textContent = '﹀'; if (ey) ey.textContent = '• •';
  const fl = $('footLeft'), fr = $('footRight'), fh = $('footerHint');
  if (fl) fl.textContent = 'CONEXIÓN SEGURA · SESIÓN LOCAL';
  if (fr) fr.textContent = 'MEMORIA: VACÍA';
  if (fh) fh.textContent = 'NO TODAS LAS PREGUNTAS SON PARA TI.';
  const sm = $('sysmsg'); if (sm) sm.classList.remove('show');
  const ti = $('typingInd'); if (ti) ti.classList.remove('show');
  if (audioOn) playTrack('calm');
  else stopAllMusic();
  refreshIntroMeta();
}

function refreshIntroMeta() {
  try {
    const p = window.TSQuestions.buildPool(Object.assign({}, saveData.past, { playCount: saveData.playCount }));
    const n = window.TSQuestions.countPool(p);
    const im = $('introMeta');
    if (im) im.innerHTML = 'DURACIÓN EST. 12–18 MIN · 20 PREGUNTAS · BANCO ~' + n + ' VARIANTES<br>Escape pausa. Exporta progreso en Ajustes. Partidas jugadas: ' + saveData.playCount;
  } catch (e) {}
}

function wireUI() {
  on($('settingsOpen'), 'click', openSettings);
  on($('settingsOpen2'), 'click', openSettings);
  on($('settingsOpen3'), 'click', openSettings);
  on($('settingsOpen4'), 'click', openSettings);
  on($('settingsClose'), 'click', closeSettings);
  on($('openEndingsBtn'), 'click', openEndings);
  on($('endingsClose'), 'click', closeEndings);
  on($('endingsModal'), 'click', e => {
    if (e.target === $('endingsModal')) closeEndings();
  });
  on($('settingsModal'), 'click', e => {
    if (e.target === $('settingsModal')) closeSettings();
  });
  on($('optSoundOn'), 'click', () => applySoundSetting(true));
  on($('optSoundOff'), 'click', () => applySoundSetting(false));
  on($('optLayoutAuto'), 'click', () => applyLayout('auto'));
  on($('optLayoutMobile'), 'click', () => applyLayout('mobile'));
  on($('optLayoutPc'), 'click', () => applyLayout('pc'));
  on($('fullscreenBtn'), 'click', toggleFullscreen);
  on($('soundToggle'), 'click', () => applySoundSetting(!audioOn));
  on($('startBtn'), 'click', begin);
  on($('restartBtn'), 'click', reset);
  on($('againBtn'), 'click', reset);

  on($('exportBtn'), 'click', () => {
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'test_subject_save_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showSysMsg('PARTIDA EXPORTADA');
  });
  on($('importBtn'), 'click', () => { const f = $('importFile'); if (f) f.click(); });
  on($('importFile'), 'change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object') throw new Error('invalid');
        saveData = Object.assign(defaultSave(), data, {
          past: Object.assign(defaultSave().past, data.past || {}),
          settings: Object.assign(defaultSave().settings, data.settings || {})
        });
        persist();
        applyLayout(saveData.settings.layout || 'auto');
        updateSettingsUI();
        refreshIntroMeta();
        showSysMsg('PARTIDA IMPORTADA · ' + (saveData.discoveredEndings || []).length + ' FINALES');
      } catch (err) {
        showSysMsg('ARCHIVO NO VÁLIDO', 3000, true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  on($('answer'), 'input', () => { lastInputTime = Date.now(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('endingsModal') && $('endingsModal').classList.contains('open')) closeEndings();
      else if ($('settingsModal') && $('settingsModal').classList.contains('open')) closeSettings();
      else if (started && $('ending') && $('ending').classList.contains('hidden')) {
        addLine('Sesión pausada. Puedes reiniciar o cerrar la página.', 'system');
        const a = $('answer'); if (a) a.blur();
        sound('tick');
      }
    }
  });
}

initMusic();
wireUI();
applyLayout(saveData.settings.layout || 'auto');
// Primera vez (sin partidas): audio activado por defecto
if (!saveData.playCount) {
  saveData.settings.sound = true;
  persist();
}
audioOn = !!saveData.settings.sound;
const st = $('soundToggle');
if (st) st.textContent = '♫ AUDIO: ' + (audioOn ? 'ON' : 'OFF');
updateSettingsUI();
refreshIntroMeta();

document.addEventListener('click', function once() {
  if (audioOn && !music.unlocked) unlockAndStartCalm();
}, true);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
})();
