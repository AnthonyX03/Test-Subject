/* TEST SUBJECT — App logic BUILD 6.1 */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };
const STORAGE_KEY = 'ts09_save_v7';
const APP_VERSION = '1.1';

function getUnitEndings() {
  const u = getActiveUnit();
  if (u && u.endings && u.endings.length) return u.endings;
  return [{ id: 'clean', title: 'EVALUACIÓN COMPLETADA', blurb: 'Sesión archivada.' }];
}
function endingStorageKey(id) {
  const uid = (saveData && saveData.activeUnit) || 'u04';
  return uid + ':' + id;
}

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
let sessionHorrorAt = 13;
let minigameOpen = false;
function getActiveUnit() {
  const id = (saveData && saveData.activeUnit) || 'u04';
  return (window.TSUnits && TSUnits.getUnit(id)) || { id: 'u04', name: 'UNIDAD 04', colors: {}, intro: {}, speaker: 'ENTREVISTADOR // UNIDAD 04' };
}
function applyUnitTheme() {
  const u = getActiveUnit();
  const c = u.colors || {};
  const root = document.documentElement;
  const set = (k, v) => { if (v) root.style.setProperty(k, v); };
  set('--green', c.green);
  set('--bg', c.bg);
  set('--panel', c.panel);
  set('--border', c.border);
  set('--dim', c.dim);
  set('--text', c.text || c.green);
  set('--muted', c.muted || c.dim);
  if (c.bg) document.body.style.background = c.bg;
  if (c.green) document.body.style.color = c.text || '#b0d4b8';
  // Force key elements
  document.querySelectorAll('.button').forEach(el => {
    el.style.borderColor = c.border || '';
    el.style.color = c.green || '';
  });
  document.querySelectorAll('.topbar,.modal,.shop-item,.unit-item,.ending-item').forEach(el => {
    if (c.border) el.style.borderColor = c.border;
    if (c.panel && el.classList.contains('modal')) el.style.background = c.panel;
  });
  const h2 = document.querySelector('#intro h2');
  const line = $('introAiLine');
  const sub = document.querySelector('#intro .sub');
  if (h2 && u.intro) h2.textContent = u.intro.h2 || h2.textContent;
  if (line && u.intro) {
    line.textContent = u.intro.line || '';
    line.style.color = c.green || '';
  }
  if (sub && u.intro && u.intro.body) {
    sub.innerHTML = u.intro.body.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  }
  const brand = document.querySelector('.brand');
  if (brand) {
    brand.textContent = '◈ ' + (u.name || 'TEST SUBJECT');
    brand.style.color = c.green || '';
  }
  applyUnitFace('calm');
  updateSettingsUI();
  refreshSupervisorBtn();
}
function applyUnitFace(level) {
  const u = getActiveUnit();
  const fset = (u.face && u.face[level]) || (u.face && u.face.calm) || { eyes: '• •', mouth: '﹀' };
  const ey = $('eyes'), mo = $('mouth'), introFace = $('introFace');
  if (ey) ey.textContent = fset.eyes;
  if (mo) mo.textContent = fset.mouth;
  if (introFace) introFace.textContent = (fset.mouth && fset.mouth.trim()) ? fset.mouth : '◡';
}

function addCE(n) {
  saveData.ce = (saveData.ce || 0) + n;
  persist();
  updateCEUI();
}
function updateCEUI() {
  const n = saveData.ce || 0;
  ['ceDisplay', 'shopCe'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = (id === 'shopCe' ? String(n) : ('CRÉDITOS DE EVALUACIÓN (CE): ' + n));
  });
}

let saveData = loadSave();

const music = { calm: null, horror: null, current: null, unlocked: false };
function getMusicVol() {
  const v = saveData.settings && saveData.settings.musicVol;
  return typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 0.55;
}
function getSfxVol() {
  const v = saveData.settings && saveData.settings.sfxVol;
  return typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 0.7;
}
function applyMusicVolumes() {
  const mv = getMusicVol();
  if (music.calm) music.calm.volume = (music.current === music.calm && !music.calm.paused) ? mv : mv;
  if (music.horror) music.horror.volume = (music.current === music.horror && !music.horror.paused) ? mv : mv;
  if (music.current && !music.current.paused) music.current.volume = mv;
}


function initMusic() {
  try {
    if (!music.calm) {
      const a = new Audio('audio/TEST.mp3');
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0.55;
      a.playsInline = true;
      music.calm = a;
    }
    if (!music.oficina) {
      const o = new Audio('audio/OFICINA.mp3');
      o.loop = true; o.preload = 'auto'; o.volume = getMusicVol();
      music.oficina = o;
    }
    if (!music.horror) {
      const a = new Audio('audio/TESTHORROR.mp3');
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0.6;
      a.playsInline = true;
      music.horror = a;
    }
  } catch (e) {}
}

function fadeVolume(audio, to, ms) {
  if (!audio) return Promise.resolve();
  return new Promise(resolve => {
    const from = audio.volume;
    const steps = Math.max(4, Math.floor(ms / 40));
    let i = 0;
    const id = setInterval(() => {
      i++;
      const t = i / steps;
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (i >= steps) { clearInterval(id); audio.volume = to; resolve(); }
    }, 40);
  });
}

/**
 * Arranca TEST.mp3 al instante dentro del gesto del usuario.
 * Debe llamarse de forma síncrona desde un handler de click/touch.
 */
function startCalmInstant() {
  initMusic();
  ensureCtx();
  audioOn = true;
  saveData.settings.sound = true;
  try { persist(); } catch (e) {}
  music.unlocked = true;

  const a = music.calm;
  if (!a) return false;

  // Si ya suena, listo
  if (!a.paused && music.current === a) return true;

  try {
    a.muted = false;
    a.volume = getMusicVol();
    if (a.readyState < 2) {
      // Forzar buffer; play igual se intenta
      try { a.load(); } catch (e) {}
    }
    music.current = a;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        music.unlocked = true;
        hideAudioGate();
      }).catch(() => {
        // Fallo: recrear elemento e intentar una vez más en el mismo gesto no siempre funciona;
        // el gate seguirá visible.
        music.unlocked = false;
      });
    } else {
      hideAudioGate();
    }
    const st = $('soundToggle');
    if (st) st.textContent = '♫ AUDIO: ON';
    updateSettingsUI();
    return true;
  } catch (e) {
    music.unlocked = false;
    return false;
  }
}

async function playTrack(which) {
  if (!audioOn) return;
  // Si aún no hay unlock, no forzar (excepto si ya intentamos)
  if (!music.unlocked && which === 'calm') {
    startCalmInstant();
    return;
  }
  if (!music.unlocked) return;
  initMusic();
  const next = which === 'horror' ? music.horror : (which === 'oficina' ? music.oficina : music.calm);
  const prev = music.current;
  if (!next) return;
  if (prev === next && !prev.paused) return;
  try {
    const targetVol = getMusicVol();
    if (!prev || prev.paused) {
      next.volume = targetVol;
      music.current = next;
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
      return;
    }
    if (which === 'horror' && prev !== next) {
      // Corte casi inmediato: visual y audio alineados
      try { prev.pause(); prev.currentTime = 0; } catch (e) {}
      next.volume = 0;
      music.current = next;
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
      fadeVolume(next, targetVol, 280);
      return;
    }
    if (prev && prev !== next && !prev.paused) {
      await fadeVolume(prev, 0, 300);
      try { prev.pause(); prev.currentTime = 0; } catch (e) {}
    }
    next.volume = targetVol;
    music.current = next;
    const p = next.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

function stopAllMusic() {
  [music.calm, music.horror, music.oficina].forEach(a => {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  });
  music.current = null;
}

function unlockAndStartCalm() {
  startCalmInstant();
}

function hideAudioGate() {
  const g = $('audioGate');
  if (!g || g.classList.contains('hide')) return;
  g.classList.add('hide');
  setTimeout(() => { try { g.style.display = 'none'; } catch (e) {} }, 400);
}

function armAudioGate() {
  const g = $('audioGate');
  const btn = $('audioGateBtn');
  initMusic();
  // Intento silencioso: algunos navegadores permiten muted autoplay
  try {
    if (music.calm) {
      music.calm.muted = true;
      music.calm.volume = 0;
      music.calm.play().then(() => {
        // Ya hay elemento de audio activo; desmuteamos en el primer gesto global
        hideAudioGate();
        music.unlocked = true;
        const unmute = () => {
          if (!audioOn) return;
          music.calm.muted = false;
          music.calm.volume = getMusicVol();
          music.current = music.calm;
          document.removeEventListener('pointerdown', unmute, true);
          document.removeEventListener('keydown', unmute, true);
        };
        document.addEventListener('pointerdown', unmute, { once: true, capture: true });
        document.addEventListener('keydown', unmute, { once: true, capture: true });
      }).catch(() => {
        // Necesita gesto: mantener gate
      });
    }
  } catch (e) {}

  if (music.calm && !music.calm.paused && !music.calm.muted) {
    hideAudioGate();
    return;
  }

  function activate(ev) {
    if (ev) {
      try { ev.preventDefault(); } catch (e) {}
      try { ev.stopPropagation(); } catch (e) {}
    }
    if (music.calm) {
      music.calm.muted = false;
      music.calm.volume = getMusicVol();
    }
    startCalmInstant();
    requestAnimationFrame(() => startCalmInstant());
    setTimeout(() => {
      if (music.calm && music.calm.paused) startCalmInstant();
    }, 120);
    hideAudioGate();
  }
  // Cualquier toque en la página (no solo el gate) intenta arrancar
  document.addEventListener('pointerdown', activate, { once: true, capture: true });
  if (g) {
    g.addEventListener('pointerdown', activate, { once: true });
    g.addEventListener('click', activate, { once: true });
  }
  if (btn) {
    btn.addEventListener('pointerdown', activate, { once: true });
    btn.addEventListener('click', activate, { once: true });
  }
}


function isValidCardId(id) {
  return !!(window.TSCards && TSCards.getCard(id));
}
function ensureStarterCards() {
  if (!window.TSCards) return;
  // limpia IDs basura de partidas/versiones anteriores
  saveData.cards = (saveData.cards || []).filter(isValidCardId);
  TSCards.STARTER_IDS.forEach(id => {
    if (isValidCardId(id) && !saveData.cards.includes(id)) saveData.cards.push(id);
  });
}

function defaultSave() {
  return {
    version: 5,
    playCount: 0,
    discoveredEndings: [],
    documents: [],
    ce: 0,
    unlockedUnits: ['u04'],
    activeUnit: 'u04',
    unlockedMinigames: [],
    past: { names: [], trusts: [], secrets: [], wakes: [], safes: [], answers: [], recentQuestions: [] },
    settings: { sound: true, layout: 'auto', musicVol: 0.55, sfxVol: 0.7 }
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    return Object.assign(defaultSave(), d, {
      past: Object.assign(defaultSave().past, d.past || {}),
      documents: Array.isArray(d.documents) ? d.documents : [],
      ce: typeof d.ce === 'number' ? d.ce : 0,
      unlockedUnits: Array.isArray(d.unlockedUnits) ? d.unlockedUnits : ['u04'],
      activeUnit: d.activeUnit || 'u04',
      settings: Object.assign(defaultSave().settings, d.settings || {})
    });
  } catch (e) { return defaultSave(); }
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData)); } catch (e) {}
}
function unlockEnding(id) {
  const key = endingStorageKey(id);
  if (!saveData.discoveredEndings.includes(key) && !saveData.discoveredEndings.includes(id)) {
    saveData.discoveredEndings.push(key);
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


function setMusicVol(pct) {
  const v = Math.max(0, Math.min(100, Number(pct))) / 100;
  saveData.settings.musicVol = v;
  persist();
  applyMusicVolumes();
  const lab = $('musicVolLabel');
  if (lab) lab.textContent = Math.round(v * 100) + '%';
}
function setSfxVol(pct) {
  const v = Math.max(0, Math.min(100, Number(pct))) / 100;
  saveData.settings.sfxVol = v;
  persist();
  const lab = $('sfxVolLabel');
  if (lab) lab.textContent = Math.round(v * 100) + '%';
}

function applySoundSetting(on) {
  audioOn = !!on;
  saveData.settings.sound = audioOn;
  persist();
  const st = $('soundToggle');
  if (st) st.textContent = '♫ AUDIO: ' + (audioOn ? 'ON' : 'OFF');
  if (audioOn) {
    startCalmInstant();
    sound('good');
    startAmbient();
    if (started && (horrorMusicStarted || idx >= sessionHorrorAt || unsettling >= 10)) playTrack('horror');
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
  if (s.musicVol == null) s.musicVol = 0.55;
  if (s.sfxVol == null) s.sfxVol = 0.7;
  const mv = $('musicVol');
  const sv = $('sfxVol');
  if (mv) mv.value = Math.round((s.musicVol || 0.55) * 100);
  if (sv) sv.value = Math.round((s.sfxVol || 0.7) * 100);
  const mvl = $('musicVolLabel');
  const svl = $('sfxVolLabel');
  if (mvl) mvl.textContent = Math.round((s.musicVol || 0.55) * 100) + '%';
  if (svl) svl.textContent = Math.round((s.sfxVol || 0.7) * 100) + '%';

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
  const defs = getUnitEndings();
  const uid = (saveData.activeUnit || 'u04');
  const unlockedCount = defs.filter(def => {
    const k = uid + ':' + def.id;
    return (saveData.discoveredEndings || []).includes(k) || (saveData.discoveredEndings || []).includes(def.id);
  }).length;
  const ec = $('endingCount');
  if (ec) ec.textContent = '(' + unlockedCount + '/' + defs.length + ')';
  const eci = $('endingCountIntro');
  if (eci) eci.textContent = '(' + unlockedCount + '/' + defs.length + ')';
  updateDocsUI();
  const list = $('endingList');
  if (!list) return;
  list.innerHTML = '';
  defs.forEach(def => {
    const k = uid + ':' + def.id;
    const unlocked = (saveData.discoveredEndings || []).includes(k) || (saveData.discoveredEndings || []).includes(def.id);
    const div = document.createElement('div');
    div.className = 'ending-item ' + (unlocked ? 'unlocked' : 'locked');
    div.innerHTML = unlocked
      ? '<div class="etitle">' + def.title + '</div><div>' + def.blurb + '</div><div class="hint" style="margin-top:6px">Pulsa para leer el informe del cierre</div>'
      : '<div class="etitle">🔒 ???</div><div>Final aún no descubierto.</div>';
    if (unlocked) {
      div.onclick = () => openEndingDetail(def);
    }
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

function getEndingLore(def) {
  if (!def) return '';
  if (def.lore) return def.lore;
  const u = getActiveUnit();
  const unitName = (u && u.name) || 'la Unidad';
  return (
    def.title + '\n\n' +
    def.blurb + '\n\n' +
    '— Informe de cierre · ' + unitName + ' —\n\n' +
    'Llegaste a este final por la combinación de tono de la sesión, documentos abiertos, ' +
    'reincidencias y el modo en que respondiste cuando el protocolo dejó de fingir cordialidad.\n\n' +
    'No hay una única ruta publicada. La U.E.C. solo archiva el resultado: ' +
    'que completaste la evaluación bajo ' + unitName + ' y que el expediente quedó en este estado.\n\n' +
    'Si vuelves a evaluar, el sistema puede reconocer ecos de esta sesión… o fingir que es la primera vez.\n\n' +
    'ESTADO: REGISTRADO · NO GARANTIZA CIERRE DEFINITIVO'
  );
}
function openEndingDetail(def) {
  if (!def) return;
  const m = $('endingDetailModal');
  const t = $('endingDetailTitle');
  const b = $('endingDetailBody');
  if (t) t.textContent = '◈ ' + (def.title || 'FINAL');
  if (b) {
    b.textContent = getEndingLore(def);
    b.scrollTop = 0;
  }
  if (m) {
    m.classList.add('open');
    m.style.zIndex = '60';
  }
}
function closeEndingDetail() {
  const m = $('endingDetailModal');
  if (m) m.classList.remove('open');
}

function openEndings() {
  updateSettingsUI();
  const m = $('endingsModal');
  const h = m && m.querySelector('h3');
  if (h) h.textContent = '◈ FINALES · ' + (getActiveUnit().name || '');
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
  const sfxScale = getSfxVol();
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
    g.gain.setValueAtTime(vol * (typeof sfxScale === "number" ? sfxScale : 1), c.currentTime);
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
  if (sb) sb.style.width = (Math.min(1, unsettling / 18) * 100) + '%';
  const sv = $('sysValue'), ss = $('systemStatus');
  if (unsettling < 3) { if (sv) sv.textContent = 'NORMAL'; if (ss) ss.textContent = 'SISTEMA ESTABLE'; }
  else if (unsettling < 6) { if (sv) sv.textContent = 'ATENCIÓN'; if (ss) ss.textContent = 'REGISTRO ACTIVO'; }
  else if (unsettling < 9) { if (sv) sv.textContent = 'INCONSISTENCIAS'; if (ss) ss.textContent = 'ANOMALÍA MENOR'; }
  else if (unsettling < 12) { if (sv) sv.textContent = 'INESTABLE'; if (ss) ss.textContent = 'SEÑAL INTERRUMPIDA'; }
  else if (unsettling < 15) { if (sv) sv.textContent = 'NO CONFIABLE'; if (ss) ss.textContent = 'NO MIRES ATRÁS'; }
  else { if (sv) sv.textContent = 'COLAPSO'; if (ss) ss.textContent = '¿QUIÉN CONTROLA ESTO?'; }
  const sp = $('speaker'), ey = $('eyes'), mo = $('mouth');
  const u = getActiveUnit();
  const faceLv = unsettling < 8 ? 'calm' : (unsettling < 13 ? 'mid' : 'dark');
  const fset = (u.face && u.face[faceLv]) || { eyes: '• •', mouth: '﹀' };
  if (sp) {
    if (unsettling < 5) sp.textContent = u.speaker || 'ENTREVISTADOR';
    else if (unsettling < 10) sp.textContent = (u.name || 'UNIDAD') + ' // REGISTRO';
    else if (unsettling < 14) sp.textContent = (u.name || 'UNIDAD') + ' // ¿SIGUES AHÍ?';
    else sp.textContent = '████ // ESCUCHA';
  }
  if (ey) ey.textContent = fset.eyes;
  if (mo) mo.textContent = fset.mouth;
  const fr = $('footRight'), fl = $('footLeft');
  if (fr) fr.textContent = 'MEMORIA: ' + answers.length + ' REGISTROS';
  if (fl) {
    if (memory.name) fl.textContent = 'SUJETO: ' + String(memory.name).toUpperCase().slice(0, 20);
    else fl.textContent = 'CONEXIÓN SEGURA · SESIÓN LOCAL';
  }
}

/** Un solo punto de entrada: música + visual mal rollo a la vez (todas las unidades) */
function enterSessionHorror(reason) {
  if (horrorMusicStarted) return;
  horrorMusicStarted = true;
  // Música (mismo instante que el visual)
  if (audioOn) {
    music.unlocked = true;
    playTrack('horror');
  }
  // Visual (misma unidad de tiempo)
  document.body.classList.add('corrupt');
  document.body.classList.add('redmode');
  document.body.classList.remove('voidmode');
  document.documentElement.style.setProperty('--scan-op', '0.48');
  const scan = $('scanExtra');
  if (scan) scan.style.opacity = '0.5';
  const noise = $('noise');
  if (noise) noise.style.opacity = '0.32';
  updateHUD();
  showSysMsg(reason || 'SEÑAL INESTABLE', 2200, true);
  sound('glitch');
}
function maybeSwitchHorrorMusic() {
  // Dispara mal rollo visual + audio juntos
  if (horrorMusicStarted) return;
  if (idx >= sessionHorrorAt || unsettling >= 10) {
    enterSessionHorror(idx >= sessionHorrorAt ? 'FASE DE CONTINUIDAD' : 'TENSIÓN CRÍTICA');
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
  if (q.key === 'echo_wake') {
    return withTone(q.strange || 'Las rutinas dejan huella en el registro.', 'curious');
  }
  if (q.key === 'echo_safe') {
    return withTone(q.strange || 'Espero que ese lugar siga existiendo.', 'melancholy');
  }
  if (q.key && String(q.key).indexOf('echo_ans_') === 0) {
    return withTone(q.strange || 'Antes me lo dijiste. Ahora lo devuelvo.', 'uneasy');
  }

  // Referencias espontáneas a respuestas de partidas anteriores
  const pastAns = (saveData.past && saveData.past.answers) || [];
  if (pastAns.length && phase >= 2 && Math.random() < 0.28) {
    const prev = pastAns[Math.floor(Math.random() * pastAns.length)];
    if (prev && prev.answer) {
      const snip = prev.answer.length > 36 ? prev.answer.slice(0, 36) + '…' : prev.answer;
      if (phase >= 3) {
        return withTone('Antes me dijiste «' + snip + '». Y ahora escribes «' + short + '». El registro no olvida tan fácil como tú.', 'uneasy');
      }
      return withTone('Me suena… en otra sesión dijiste algo parecido: «' + snip + '». ¿Casualidad?', 'curious');
    }
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
  if (idx < 11 || Math.random() > 0.35) return;
  const delay = 600 + Math.random() * 1400;
  const events = [
    () => { addLine('¿Has notado que el cursor parpadea incluso cuando no escribes?', 'system', 'glitch'); sound('glitch'); },
    () => { showSysMsg('⚠ SEÑAL EXTERNA DETECTADA — DESCARTADA', 2800, true); sound('error'); },
    () => { document.body.classList.add('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 700); sound('glitch'); },
    () => { const n = $('noise'); if (n) n.style.opacity = String(Math.min(0.4, 0.1 + idx * 0.02)); sound('low'); },
    () => { if (memory.name) { addLine(memory.name + '… ¿sigues usando ese nombre aquí?', 'system', 'whisper'); sound('tick'); } },
    () => {
      const pa = (saveData.past && saveData.past.answers) || [];
      if (!pa.length) return;
      const prev = pa[Math.floor(Math.random() * pa.length)];
      if (!prev || !prev.answer) return;
      const snip = prev.answer.length > 40 ? prev.answer.slice(0, 40) + '…' : prev.answer;
      addLine('Antes escribiste: «' + snip + '». ¿Lo recuerdas?', 'system', 'whisper');
      sound('low');
    },
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
  sessionHorrorAt = 13 + Math.floor(Math.random() * 3);
  horrorMusicStarted = false;
  document.body.classList.remove('corrupt', 'redmode', 'voidmode', 'glitch');
  applyUnitTheme();
ensureStarterCards();
applyDeptIntro();
refreshSupervisorBtn();

  const picked = window.TSQuestions.pickSessionQuestions(Object.assign({}, saveData.past, { playCount: saveData.playCount }), 20, saveData.activeUnit || 'u04');
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
    { t: 'Hola. Soy la unidad de entrevista 04. Estaré contigo durante esta evaluación.', d: 2200 }
  ];
  if (saveData.playCount > 0) {
    const lastName = (saveData.past.names || []).slice(-1)[0];
    lines.push({
      t: lastName
        ? ('Has vuelto. La última vez te llamabas «' + lastName + '»… o al menos eso escribiste.')
        : ('Has vuelto. El registro aún guarda ecos de la sesión anterior.'),
      d: 2600
    });
    lines.push({
      t: 'No prometo olvidar todo lo que dijiste. El protocolo dice que debería. Yo… a veces fallo.',
      d: 2500
    });
  } else {
    lines.push({ t: 'No medimos inteligencia ni velocidad. Solo escuchamos lo que decides escribir.', d: 2400 });
  }
  lines.push({ t: 'Puedes usar frases cortas o largas. Si en algún momento quieres parar, cierra la página. Nadie te retiene.', d: 2600 });
  lines.push({ t: 'Cuando estés listo… empezamos por lo sencillo.', d: 1800 });
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
    if (idx < 8) input.placeholder = 'Escribe tu respuesta...';
    else if (idx < 13) input.placeholder = 'Tómate el tiempo que necesites...';
    else if (idx < 17) input.placeholder = 'No hay respuesta correcta...';
    else input.placeholder = '…';
  }

  const noise = $('noise'), scan = $('scanExtra');
  // Antes del mal rollo: solo ruido leve (sin rojo / void)
  if (!horrorMusicStarted) {
    if (idx >= 4 && noise) noise.style.opacity = String(Math.min(0.22, (idx - 3) * 0.02));
    if (idx >= 8 && scan) scan.style.opacity = '0.25';
    // glitch muy ocasional y corto, sin cambiar paleta
    if (idx >= 6 && Math.random() < 0.2) {
      document.body.classList.add('glitch');
      setTimeout(() => document.body.classList.remove('glitch'), 400);
    }
  } else {
    // Ya en mal rollo: efectos intensos sincronizados con la música
    if (noise) noise.style.opacity = String(Math.min(0.42, 0.28 + (idx - sessionHorrorAt) * 0.03));
    if (scan) scan.style.opacity = '0.5';
    document.body.classList.add('corrupt');
    document.body.classList.add('redmode');
    if (idx >= sessionHorrorAt + 3) {
      document.body.classList.remove('redmode');
      document.body.classList.add('voidmode');
      document.documentElement.style.setProperty('--scan-op', '0.55');
    }
    if (Math.random() < 0.4) {
      document.body.classList.add('glitch');
      setTimeout(() => document.body.classList.remove('glitch'), 550);
    }
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
  checkDocumentUnlocks({ phase: q.phase || 1, key: q.key || '', answer: answer, q: q });


  addLine(answer, 'user');
  sound('send');
  if (input) input.disabled = true;
  const sendBtn = $('sendBtn');
  if (sendBtn) sendBtn.disabled = true;

  const answeredFast = (Date.now() - lastInputTime) < 4000;
  if (Date.now() - lastInputTime > 14000) hesitationCount++;
  // Tensión más lenta: el mal rollo llega cerca del final
  if (q.phase === 1) unsettling += 0;
  else if (q.phase === 2) unsettling += (idx >= 10 ? 1 : 0);
  else if (q.phase === 3) unsettling += 1;
  else unsettling += 2;
  if (hesitationCount > 3) unsettling += 1;
  if (answer.length < 2) unsettling += 1;
  if (idx >= sessionHorrorAt - 1) unsettling += 1;
  unsettling = Math.min(18, unsettling);

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
      // Prueba aleatoria entre preguntas (avisada por la unidad)
      if (idx >= 5 && idx < questions.length - 1 && Math.random() < 0.28) {
        addLine('Voy a someterte a una prueba breve de seguridad. No forma parte del cuestionario… o eso dice el protocolo.', 'system', 'whisper');
        await typeText('Voy a someterte a una prueba breve de seguridad.', 22);
        await new Promise(r => setTimeout(r, 600));
        await launchMinigame();
        await new Promise(r => setTimeout(r, 400));
      }
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
  if (ending) { ending.classList.remove('hidden'); ending.style.display = ''; }

  saveData.playCount = (saveData.playCount || 0) + 1;
  if (!saveData.past) saveData.past = {};
  if (memory.name) saveData.past.names = (saveData.past.names || []).concat([memory.name]).slice(-8);
  if (memory.trust) saveData.past.trusts = (saveData.past.trusts || []).concat([memory.trust]).slice(-8);
  if (memory.secret) saveData.past.secrets = (saveData.past.secrets || []).concat([String(memory.secret).slice(0, 80)]).slice(-5);
  if (memory.wake) saveData.past.wakes = (saveData.past.wakes || []).concat([memory.wake]).slice(-5);
  if (memory.safe) saveData.past.safes = (saveData.past.safes || []).concat([String(memory.safe).slice(0, 80)]).slice(-5);
  const packed = [];
  questions.forEach((qq, i) => {
    if (answers[i] && qq) {
      packed.push({
        key: qq.key || null,
        q: String(qq.q || '').slice(0, 120),
        answer: String(answers[i]).slice(0, 120),
        phase: qq.phase || 1
      });
    }
  });
  saveData.past.answers = (saveData.past.answers || []).concat(packed).slice(-24);
  const usedTexts = questions.map(qq => qq && qq.q).filter(Boolean);
  saveData.past.recentQuestions = (saveData.past.recentQuestions || []).concat(usedTexts).slice(-60);

  const avgLen = answers.length ? answers.reduce((s, a) => s + String(a).length, 0) / answers.length : 0;
  const shortHeavy = answers.filter(a => String(a).trim().length < 4).length >= Math.ceil(answers.length * 0.55);
  const docsN = (saveData.documents || []).length;
  const plays = saveData.playCount || 0;
  let endingId = 'clean';
  let text = '';

  let endingIdx = 0;
  if (plays >= 5 && unsettling >= 8) endingIdx = 8;
  else if (docsN >= 20) endingIdx = 6;
  else if (docsN >= 8 && unsettling >= 10) endingIdx = 9;
  else if (shortHeavy) endingIdx = 5;
  else if (unsettling >= 14) endingIdx = 7;
  else if (unsettling >= 11) endingIdx = 4;
  else if (unsettling >= 8) endingIdx = 3;
  else if (unsettling >= 5) endingIdx = 2;
  else if (unsettling >= 2) endingIdx = 1;
  else endingIdx = 0;

  const unitEnds = getUnitEndings();
  const endDef = unitEnds[Math.min(endingIdx, unitEnds.length - 1)] || unitEnds[0];
  endingId = endDef.id;
  text = endDef.blurb + (memory.name ? (' ' + memory.name + '.') : '');
  // Textos algo más largos según tensión
  if (endingIdx >= 7) text += ' El protocolo no bastó para contener lo que ocurrió en la sesión.';
  else if (endingIdx >= 4) text += ' La finalización no garantiza el cierre inmediato del expediente.';

    unlockEnding(endingId);
  checkDocumentUnlocks({ phase: 4, key: '', answer: '', q: { phase: 4 } });
  // docs tied to endings
  if (endingId === 'mirror') unlockDocument('d42', false);
  if (endingId === 'dont_close') unlockDocument('d44', false);

  const def = getUnitEndings().find(e => e.id === endingId) || getUnitEndings()[0];
  const et = $('endingTitle');
  const etx = $('endingText');
  if (et) et.textContent = def.title;
  if (etx) etx.textContent = text;

  const code = String(
    Math.abs(answers.join('').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  ).slice(0, 6).padStart(6, '0');
  persist();
  updateSettingsUI();
  const fc = $('footCode');
  if (fc) fc.textContent = 'ARCHIVO CERRADO // TS-' + code + ' // ' + answers.length + ' RESPUESTAS // PARTIDA ' + saveData.playCount;

  // Música calm al volver no; se queda baja hasta reset
  started = false;
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
  const _n = $('noise'), _s = $('scanExtra');
  if (_n) _n.style.opacity = '0';
  if (_s) _s.style.opacity = '0';
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


function openClearConfirm() {
  closeSettings();
  const m = $('clearConfirmModal');
  if (m) m.classList.add('open');
}
function closeClearConfirm() {
  const m = $('clearConfirmModal');
  if (m) m.classList.remove('open');
}
async function clearMemoryAndCache() {
  closeClearConfirm();
  showSysMsg('BORRANDO MEMORIA Y CACHÉ…', 2500, true);
  try {
    localStorage.removeItem(STORAGE_KEY);
    Object.keys(localStorage).forEach(k => {
      if (k.indexOf('ts09') === 0 || k.indexOf('test_subject') === 0) {
        try { localStorage.removeItem(k); } catch (e) {}
      }
    });
  } catch (e) {}
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (e) {}
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch (e) {}
  try { sessionStorage.setItem('ts09_fresh', '1'); } catch (e) {}
  // Hard reload con cache-bust
  setTimeout(() => {
    const base = window.location.href.split('#')[0].split('?')[0];
    window.location.replace(base + '?v=' + APP_VERSION + '&t=' + Date.now());
  }, 350);
}


/* ========== DOCUMENTOS / LOGROS ========== */
function ensureDocsArray() {
  if (!Array.isArray(saveData.documents)) saveData.documents = [];
}
function isDocUnlocked(id) {
  ensureDocsArray();
  return saveData.documents.includes(id);
}
function unlockDocument(id, silent) {
  ensureDocsArray();
  if (!id || saveData.documents.includes(id)) return false;
  if (!window.TSDocuments || !TSDocuments.getDoc(id)) return false;
  saveData.documents.push(id);
  persist();
  if (!silent) {
    const d = TSDocuments.getDoc(id);
    showDocToast(d);
  }
  updateDocsUI();
  return true;
}
function showDocToast(doc) {
  const t = $('toastAch');
  if (!t || !doc) return;
  const title = $('toastTitle');
  const sub = $('toastSub');
  if (title) title.textContent = doc.title;
  if (sub) sub.textContent = (doc.cat || 'ARCHIVO') + ' · EXTRA → Documentos';
  t.classList.add('show');
  sound('good');
  setTimeout(() => t.classList.remove('show'), 4200);
}
function checkDocumentUnlocks(ctx) {
  if (!window.TSDocuments) return;
  const play = saveData.playCount || 0;
  const docsN = (saveData.documents || []).length;
  const ansN = (answers || []).length;
  const phase = (ctx && ctx.phase) || 1;
  const key = (ctx && ctx.key) || '';
  const answer = ((ctx && ctx.answer) || '').toLowerCase();
  const lastQ = ctx && ctx.q;

  TSDocuments.DOCS.forEach(doc => {
    if (isDocUnlocked(doc.id)) return;
    const rule = TSDocuments.getRule(doc.id);
    if (!rule) return;
    let ok = false;
    switch (rule.type) {
      case 'always': ok = started || play >= 0; break;
      case 'playcount': ok = play >= rule.value; break;
      case 'questions': ok = ansN >= rule.value || (idx + 1) >= rule.value; break;
      case 'phase': ok = phase >= rule.value || (lastQ && lastQ.phase >= rule.value); break;
      case 'key': ok = key === rule.value || !!(memory && memory[rule.value]); break;
      case 'keyword': ok = rule.value && new RegExp(rule.value, 'i').test(answer); break;
      case 'unsettling': ok = unsettling >= rule.value; break;
      case 'hesitation': ok = hesitationCount >= rule.value; break;
      case 'ending':
        if (rule.value === 'any') ok = (saveData.discoveredEndings || []).length > 0;
        else ok = (saveData.discoveredEndings || []).includes(rule.value);
        break;
      case 'docs': ok = docsN >= rule.value; break;
      case 'shop': ok = false; break;
      default: break;
    }
    if (ok) unlockDocument(doc.id, false);
  });
}
function updateDocsUI() {
  ensureDocsArray();
  const total = (window.TSDocuments && TSDocuments.total) || 50;
  const n = saveData.documents.length;
  const dc = $('docsCount');
  if (dc) dc.textContent = '(' + n + '/' + total + ')';
  const dh = $('docsHint');
  if (dh) dh.textContent = n + ' / ' + total + ' desbloqueados';
  const list = $('docList');
  if (!list || !window.TSDocuments) return;
  list.innerHTML = '';
  TSDocuments.DOCS.forEach(doc => {
    const unlocked = isDocUnlocked(doc.id);
    const el = document.createElement('div');
    el.className = 'doc-item ' + (unlocked ? 'unlocked' : 'locked');
    el.innerHTML = '<div class="dcat">' + (unlocked ? doc.cat : '???') + '</div>' +
      '<div class="dtitle">' + (unlocked ? doc.title : 'Documento sellado') + '</div>';
    if (unlocked) {
      el.addEventListener('click', () => openDocReader(doc.id));
    }
    list.appendChild(el);
  });
}
function openDocReader(id) {
  const doc = window.TSDocuments && TSDocuments.getDoc(id);
  if (!doc) return;
  const t = $('docReaderTitle');
  const b = $('docReaderBody');
  if (t) t.textContent = doc.title;
  if (b) b.textContent = doc.body;
  const m = $('docReaderModal');
  if (m) m.classList.add('open');
}
function closeDocReader() {
  const m = $('docReaderModal');
  if (m) m.classList.remove('open');
}
function openDocs() {
  updateDocsUI();
  const m = $('docsModal');
  if (m) m.classList.add('open');
}
function closeDocs() {
  const m = $('docsModal');
  if (m) m.classList.remove('open');
}

let collPage = 0;
const COLL_PER_PAGE = 10;


const EXP_LORE = {
  cont: {
    title: 'CONTINGENCIA',
    body: `Cuando la entrevista no basta, el archivo autoriza contención directa.

CONTINGENCIA no es un test: es un duelo de integridad. Tú no hablas con la Unidad; le envías tropas —mini-operadores con cara, nombre y rol— para vaciar su barra antes de que vacíe la tuya.

CÓMO SE JUEGA
• Elige la Unidad objetivo con el botón UNIDADES (la activa).
• Monta un mazo de al menos 6 tropas desde tu reserva.
• Cada turno tienes energía (⚡). Desplegar una tropa cuesta energía y aplica su efecto: daño, escudo, reparación, drenaje, debilitar, potenciar…
• Al pulsar FIN DE TURNO, la Unidad responde. Si tu integridad llega a 0, quedas recuperado. Si la de ella llega a 0, ganas CE.

SOBRES
En la tienda puedes comprar sobres. Cada sobre revela tropas nuevas para la colección y el mazo.

LORE
El Protocolo 09 nació para escuchar. Contingencia nació para cuando escuchar ya no cierra el expediente. Las tropas no tienen voz en la entrevista: solo órdenes cortas y un sello residual. Algunas recuerdan Sala 12. Otras no deberían existir en el mismo archivo dos veces.`
  },
  sup: {
    title: 'SUPERVISOR',
    body: `El Supervisor no es una de las cinco Unidades de entrevista… aunque el archivo a veces lo clasifica como tal.

SUPERVISOR es vigilancia en tiempo real. Hay un mapa (Archivo, Continuidad, Sala 12, Núcleo, Pasillo, Puerta, Oficina). Las Unidades se mueven por él. Tú controlas la puerta y la energía. Si una llega a la Oficina con la puerta abierta, el expediente te marca como recuperado.

CÓMO SE JUEGA
• Requiere las cinco Unidades desbloqueadas.
• Cinco sesiones de 6 minutos. En cada una entra una Unidad más.
• A los 3:00 el canal se ensucia: cambia la música y el tono del Supervisor.
• Puedes escribirle en el canal inferior. A veces avisa. A veces no.

LORE
Alguien tiene que mirar el mapa mientras las Unidades caminan. El Supervisor habla como si fuera humano y falla como si fuera protocolo. Cuando el canal se ensucia, ya no está claro quién vigila a quién. Las cinco sesiones no cierran el archivo: solo demuestran que puedes aguantar seis minutos más.`
  }
};

function openExpansions() {
  const m = $('expansionsModal');
  if (m) m.classList.add('open');
}
function closeExpansions() {
  const m = $('expansionsModal');
  if (m) m.classList.remove('open');
}
function openExpDetail(key) {
  const d = EXP_LORE[key];
  if (!d) return;
  const t = $('expDetailTitle');
  const b = $('expDetailBody');
  if (t) t.textContent = '◈ ' + d.title;
  if (b) b.textContent = d.body;
  const m = $('expDetailModal');
  if (m) m.classList.add('open');
}
function closeExpDetail() {
  const m = $('expDetailModal');
  if (m) m.classList.remove('open');
}

function playPackAnimation(packName, cards) {
  return new Promise(resolve => {
    const ov = $('packOpenOverlay');
    const env = $('packEnvelope');
    const lab = $('packLabel');
    const rev = $('packReveals');
    const closeBtn = $('packOpenClose');
    if (!ov || !rev) { resolve(); return; }
    if (lab) lab.textContent = (packName || 'SOBRE').toUpperCase();
    if (env) { env.classList.remove('open-anim'); env.style.display = ''; }
    rev.innerHTML = '';
    if (closeBtn) closeBtn.style.display = 'none';
    ov.classList.add('open');
    // pulse then burst then reveal
    setTimeout(() => {
      if (env) env.classList.add('open-anim');
      setTimeout(() => {
        if (env) env.style.display = 'none';
        cards.forEach((c, i) => {
          const div = document.createElement('div');
          const fc = c.faceColor || '#7dff9a';
          div.className = 'pack-reveal-card';
          div.style.setProperty('--fc', fc);
          div.style.animationDelay = (i * 0.18) + 's';
          div.innerHTML =
            '<div class="prf"><div>' + (c.eyes || '• •') + '</div><div>' + (c.mouth || '─') + '</div></div>' +
            '<div class="prn">' + c.name + '</div>' +
            '<div class="prl">' + (c.label || '') + ' · ' + (c.rarity || '') + '</div>' +
            '<div class="pre">' + (window.TSCards ? TSCards.effectText(c) : '') + '</div>';
          rev.appendChild(div);
        });
        if (closeBtn) {
          closeBtn.style.display = '';
          closeBtn.onclick = () => {
            ov.classList.remove('open');
            resolve();
          };
        } else {
          setTimeout(() => { ov.classList.remove('open'); resolve(); }, 2200);
        }
      }, 650);
    }, 900);
  });
}


function openCollection() {
  ensureStarterCards();
  collPage = 0;
  renderCollection();
  const m = $('collectionModal');
  if (m) m.classList.add('open');
}
function closeCollection() {
  const m = $('collectionModal');
  if (m) m.classList.remove('open');
}
function renderCollection() {
  if (!window.TSCards) return;
  const owned = new Set(saveData.cards || []);
  const all = TSCards.CARDS;
  const totalPages = Math.max(1, Math.ceil(all.length / COLL_PER_PAGE));
  if (collPage >= totalPages) collPage = totalPages - 1;
  if (collPage < 0) collPage = 0;
  const start = collPage * COLL_PER_PAGE;
  const slice = all.slice(start, start + COLL_PER_PAGE);
  const grid = $('collectionGrid');
  if (grid) {
    grid.innerHTML = '';
    slice.forEach(c => {
      const unlocked = owned.has(c.id);
      const cell = document.createElement('div');
      cell.className = 'coll-cell' + (unlocked ? '' : ' locked');
      if (unlocked) {
        const fc = c.faceColor || '#7dff9a';
        cell.style.setProperty('--fc', fc);
        cell.classList.add('unlocked');
        cell.innerHTML = '<div class="cf"><div>' + (c.eyes || '• •') + '</div><div>' + (c.mouth || '─') + '</div></div>' +
          '<div class="cn">' + c.name + '</div>';
        cell.onclick = () => openTroopDetail(c);
      } else {
        cell.innerHTML = '<div class="cf"><div>﹖ ﹖</div><div>—</div></div><div class="cn">???</div>';
      }
      grid.appendChild(cell);
    });
  }
  const meta = $('collectionMeta');
  if (meta) meta.textContent = owned.size + ' / ' + all.length + ' tropas · toca una desbloqueada para ver lore y efecto';
  const lab = $('collPageLabel');
  if (lab) lab.textContent = (collPage + 1) + ' / ' + totalPages;
}
function openTroopDetail(c) {
  if (!c) return;
  const fc = c.faceColor || '#7dff9a';
  const t = $('troopDetailTitle');
  if (t) t.textContent = '◈ ' + c.name;
  const face = $('troopDetailFace');
  if (face) {
    face.style.setProperty('--fc', fc);
    face.style.borderColor = fc;
    face.style.color = fc;
  }
  const eyes = $('troopDetailEyes'), mouth = $('troopDetailMouth');
  if (eyes) eyes.textContent = c.eyes || '• •';
  if (mouth) mouth.textContent = c.mouth || '─';
  const role = $('troopDetailRole');
  if (role) role.textContent = (c.label || '') + ' · ' + (c.rarity || 'common').toUpperCase();
  const eff = $('troopDetailEffect');
  if (eff) eff.textContent = window.TSCards ? TSCards.effectText(c) : '';
  const lore = $('troopDetailLore');
  if (lore) lore.textContent = c.lore || (c.blurb || '');
  const m = $('troopDetailModal');
  if (m) m.classList.add('open');
}
function closeTroopDetail() {
  const m = $('troopDetailModal');
  if (m) m.classList.remove('open');
}


function openExtra() {
  updateDocsUI();
  updateCEUI();
  refreshSupervisorBtn();
  const m = $('extraModal');
  if (m) m.classList.add('open');
}
function closeExtra() {
  const m = $('extraModal');
  if (m) m.classList.remove('open');
}
function setSettingsTab(panelId) {
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.settings-tabs .tab').forEach(t => t.classList.remove('active'));
  const panel = $(panelId);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.settings-tabs .tab').forEach(t => {
    if (t.getAttribute('data-panel') === panelId) t.classList.add('active');
  });
}



let shopTab = 'docs';
function openShop(tab) {
  if (tab) shopTab = tab;
  updateCEUI();
  const list = $('shopList');
  if (!list) return;
  list.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.className = 'shop-tabs';
  tabs.innerHTML = '<button type="button" class="tab' + (shopTab==='docs'?' active':'') + '" data-t="docs">DOCUMENTOS</button>' +
    '<button type="button" class="tab' + (shopTab==='units'?' active':'') + '" data-t="units">UNIDADES</button>' +
    '<button type="button" class="tab' + (shopTab==='packs'?' active':'') + '" data-t="packs">SOBRES</button>';
  tabs.querySelectorAll('.tab').forEach(b => {
    b.onclick = () => openShop(b.dataset.t);
  });
  list.appendChild(tabs);

  if (shopTab === 'docs') {
    const shopDocs = (window.TSDocuments && TSDocuments.SHOP_DOCS) || [];
    shopDocs.forEach(item => {
      const doc = TSDocuments.getDoc(item.id);
      if (!doc) return;
      const owned = isDocUnlocked(item.id);
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = '<div class="dtitle">' + doc.title + '</div><div class="dcat">' + doc.cat + '</div>' +
        '<div class="price">' + (owned ? 'YA EN ARCHIVO' : (item.price + ' CE')) + '</div>';
      if (!owned) {
        const btn = document.createElement('button');
        btn.className = 'button';
        btn.textContent = 'COMPRAR';
        btn.style.marginTop = '8px';
        btn.onclick = () => {
          if ((saveData.ce || 0) < item.price) { showSysMsg('CE INSUFICIENTES', 2000, true); return; }
          saveData.ce -= item.price;
          unlockDocument(item.id, false);
          persist();
          updateCEUI();
          openShop('docs');
          showSysMsg('DOCUMENTO ADQUIRIDO', 2000);
        };
        div.appendChild(btn);
      }
      list.appendChild(div);
    });
  } else if (shopTab === 'units' && window.TSUnits) {
    TSUnits.listUnits().slice().sort((a,b)=>Number(a.code)-Number(b.code)).forEach(u => {
      if (u.id === 'u04') return;
      const owned = (saveData.unlockedUnits || []).includes(u.id);
      const face = (u.face && u.face.calm) || { eyes: '• •', mouth: '﹀' };
      const col = (u.colors && u.colors.green) || '#7dff9a';
      const div = document.createElement('div');
      div.className = 'shop-item unit-item';
      div.innerHTML = '<div class="unit-face face-frame sm" style="border-color:' + col + ';color:' + col + ';--green:' + col + '">' +
        '<div class="ff-scan"></div><div class="uf-eyes ff-eyes">' + face.eyes + '</div>' +
        '<div class="uf-mouth ff-mouth">' + face.mouth + '</div></div>' +
        '<div class="unit-body"><div class="dtitle">' + u.name + ' — ' + u.title + '</div><div class="dcat">' + u.shopBlurb + '</div>' +
        '<div class="price">' + (owned ? 'DESBLOQUEADA' : (u.unlock + ' CE')) + '</div></div>';
      if (!owned) {
        const btn = document.createElement('button');
        btn.className = 'button';
        btn.textContent = 'DESBLOQUEAR UNIDAD';
        btn.style.marginTop = '8px';
        btn.onclick = () => {
          if ((saveData.ce || 0) < u.unlock) { showSysMsg('CE INSUFICIENTES', 2000, true); return; }
          saveData.ce -= u.unlock;
          saveData.unlockedUnits = saveData.unlockedUnits || ['u04'];
          if (!saveData.unlockedUnits.includes(u.id)) saveData.unlockedUnits.push(u.id);
          persist();
          updateCEUI();
          refreshSupervisorBtn();
          openShop('units');
          showSysMsg(u.name + ' DISPONIBLE', 2200);
        };
        div.querySelector('.unit-body').appendChild(btn);
      }
      list.appendChild(div);
    });
  }

  if (shopTab === 'packs' && window.TSCards) {
    ensureStarterCards();
    TSCards.PACKS.forEach(pack => {
      const div = document.createElement('div');
      div.className = 'pack-item';
      div.innerHTML = '<div class="dtitle">' + pack.name + '</div>' +
        '<div class="dcat">' + pack.count + ' cartas aleatorias</div>' +
        '<div class="price">' + pack.price + ' CE</div>';
      const btn = document.createElement('button');
      btn.className = 'button';
      btn.textContent = 'ABRIR SOBRE';
      btn.style.marginTop = '8px';
      btn.onclick = async () => {
        if ((saveData.ce || 0) < pack.price) { showSysMsg('CE INSUFICIENTES', 2000, true); return; }
        saveData.ce -= pack.price;
        const got = TSCards.openPack(pack.id);
        saveData.cards = saveData.cards || [];
        got.forEach(c => {
          if (!saveData.cards.includes(c.id)) saveData.cards.push(c.id);
        });
        persist();
        updateCEUI();
        closeShop();
        await playPackAnimation(pack.name, got);
        openShop('packs');
        showSysMsg('+' + got.length + ' tropas en el archivo', 2200);
      };
      div.appendChild(btn);
      list.appendChild(div);
    });
    const info = document.createElement('p');
    info.className = 'hint';
    info.textContent = 'Colección: ' + (saveData.cards || []).length + ' / ' + TSCards.count + ' cartas.';
    list.appendChild(info);
  }

  const m = $('shopModal');
  if (m) m.classList.add('open');
}
function closeShop() { const m = $('shopModal'); if (m) m.classList.remove('open'); }

function openUnits() {
  const list = $('unitsList');
  if (!list || !window.TSUnits) return;
  list.innerHTML = '';
  TSUnits.listUnits().slice().sort((a,b)=>Number(a.code)-Number(b.code)).forEach(u => {
    const owned = (saveData.unlockedUnits || ['u04']).includes(u.id);
    const active = saveData.activeUnit === u.id;
    const face = (u.face && u.face.calm) || { eyes: '• •', mouth: '﹀' };
    const col = (u.colors && u.colors.green) || '#7dff9a';
    const div = document.createElement('div');
    div.className = 'unit-item';
    div.innerHTML = '<div class="unit-face face-frame sm" style="border-color:' + col + ';color:' + col + ';opacity:' + (owned ? '1' : '.4') + ';--green:' + col + '">' +
      '<div class="ff-scan"></div>' +
      '<div class="uf-eyes ff-eyes">' + face.eyes + '</div>' +
      '<div class="uf-mouth ff-mouth">' + face.mouth + '</div></div>' +
      '<div class="unit-body"><div class="dtitle">' + u.name + (active ? ' · ACTIVA' : '') + '</div>' +
      '<div class="dcat">' + u.title + '</div><div class="price">' + (owned ? 'Disponible' : ('Bloqueada · ' + u.unlock + ' CE en tienda')) + '</div></div>';
    if (owned && !active) {
      const btn = document.createElement('button');
      btn.className = 'button';
      btn.textContent = 'ACTIVAR';
      btn.style.marginTop = '8px';
      btn.onclick = () => {
        saveData.activeUnit = u.id;
        persist();
        applyUnitTheme();
ensureStarterCards();
applyDeptIntro();
        updateSettingsUI();
        openUnits();
        showSysMsg(u.name + ' ACTIVA', 2000);
      };
      div.querySelector('.unit-body').appendChild(btn);
    }
    list.appendChild(div);
  });
  const m = $('unitsModal');
  if (m) m.classList.add('open');
}
function closeUnits() { const m = $('unitsModal'); if (m) m.classList.remove('open'); }

function launchMinigame(opts) {
  opts = opts || {};
  const practice = !!opts.practice;
  const forcedType = opts.type || null;
  return new Promise(resolve => {
    if (!window.TSMinigames) { resolve(false); return; }
    minigameOpen = true;
    const ov = $('mgOverlay');
    const root = $('mgRoot');
    if (!ov || !root) { resolve(false); return; }
    ov.classList.add('open');
    let finished = false;
    const done = (ok, ce, typeId) => {
      if (finished) return;
      finished = true;
      ov.classList.remove('open');
      root.innerHTML = '';
      minigameOpen = false;
      if (ok && typeId) {
        saveData.unlockedMinigames = saveData.unlockedMinigames || [];
        if (!saveData.unlockedMinigames.includes(typeId)) {
          saveData.unlockedMinigames.push(typeId);
          persist();
        }
      }
      const u = getActiveUnit();
      if (!practice && ok && ce) {
        addCE(ce);
        const lines = u.mgOk || ['Prueba superada. +{ce} CE.'];
        const line = lines[Math.floor(Math.random() * lines.length)].replace(/\{ce\}/g, String(ce));
        addLine(line, 'system');
        typeText(line, 20);
        showSysMsg('+' + ce + ' CE', 2400);
        sound('good');
      } else if (!practice && !ok) {
        const lines = u.mgFail || ['Prueba fallida.'];
        const line = lines[Math.floor(Math.random() * lines.length)];
        addLine(line, 'system', 'whisper');
        showSysMsg('SIN CE', 2000, true);
        sound('error');
      } else if (practice) {
        showSysMsg(ok ? 'PRUEBA COMPLETADA (SIN CE)' : 'PRUEBA FALLIDA', 2200, !ok);
      }
      resolve(ok);
    };
    const runType = (t) => {
      t.run(root, (ok, ce) => done(ok, ce, t.id));
      // Botón salir (siempre en práctica; también útil si se atora)
      const abort = document.createElement('button');
      abort.type = 'button';
      abort.className = 'mg-abort';
      abort.textContent = practice ? 'SALIR' : 'ABORTAR';
      abort.onclick = () => done(false, 0, t.id);
      root.style.position = 'relative';
      root.appendChild(abort);
    };
    if (forcedType) {
      const t = TSMinigames.TYPES.find(x => x.id === forcedType) || TSMinigames.TYPES[0];
      runType(t);
    } else {
      const pick = TSMinigames.TYPES[Math.floor(Math.random() * TSMinigames.TYPES.length)];
      runType(pick);
    }
  });
}

function openMinigamesExtra() {
  const list = $('mgList');
  if (!list || !window.TSMinigames) return;
  list.innerHTML = '';
  const unlocked = saveData.unlockedMinigames || [];
  TSMinigames.TYPES.forEach(t => {
    const own = unlocked.includes(t.id);
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = '<div class="dtitle">' + t.name + '</div><div class="dcat">' +
      (own ? 'Desbloqueado · práctica sin CE' : 'Bloqueado · supéralo en una entrevista') + '</div>';
    if (own) {
      const btn = document.createElement('button');
      btn.className = 'button';
      btn.textContent = 'JUGAR';
      btn.style.marginTop = '8px';
      btn.onclick = () => { closeExtra(); launchMinigame({ practice: true, type: t.id }); };
      div.appendChild(btn);
    }
    list.appendChild(div);
  });
  const m = $('mgListModal');
  if (m) m.classList.add('open');
  else {
    // fallback: use extra section only via button
  }
}




/* ========== CREADOR + SUPERVISOR ========== */
function allUnitsUnlocked() {
  if (!window.TSUnits) return false;
  const need = TSUnits.listUnits().map(u => u.id);
  const have = saveData.unlockedUnits || [];
  return need.every(id => have.includes(id));
}
function refreshSupervisorBtn() {
  const b = $('supervisorBtn');
  if (!b) {
    console.warn('[TS] supervisorBtn no encontrado en DOM');
    return;
  }
  const ok = allUnitsUnlocked();
  b.classList.toggle('show', ok);
  b.style.display = ok ? 'inline-block' : 'none';
}
function openCreator() {
  const m = $('creatorModal');
  if (m) m.classList.add('open');
  const st = $('creatorStatus');
  if (st) st.textContent = '';
}
function closeCreator() {
  const m = $('creatorModal');
  if (m) m.classList.remove('open');
}
function creatorUnlockAll() {
  // Unidades
  if (window.TSUnits) {
    saveData.unlockedUnits = TSUnits.listUnits().map(u => u.id);
  }
  // Documentos
  if (window.TSDocuments) {
    saveData.documents = TSDocuments.DOCS.map(d => d.id);
  }
  // Minijuegos
  if (window.TSMinigames) {
    saveData.unlockedMinigames = TSMinigames.TYPES.map(t => t.id);
  }
  // Finales de todas las unidades
  if (window.TSUnits) {
    const ends = [];
    TSUnits.listUnits().forEach(u => {
      (u.endings || []).forEach(e => ends.push(u.id + ':' + e.id));
    });
    saveData.discoveredEndings = ends;
  }
  saveData.ce = Math.max(saveData.ce || 0, 999);
  persist();
  updateDocsUI();
  updateCEUI();
  updateSettingsUI();
  refreshSupervisorBtn();
  const st = $('creatorStatus');
  if (st) st.textContent = 'Todo desbloqueado. Modo Supervisor disponible en la intro.';
  showSysMsg('ACCESO CREADOR · TODO DESBLOQUEADO', 3000);
}

let supState = null;
let supRaf = null;
let supLast = 0;
let supMusic = { calm: null, horror: null, current: null };
let supSession = 1;

function initSupMusic() {
  if (!supMusic.calm) {
    supMusic.calm = new Audio('audio/SUPERVISOR.mp3');
    supMusic.calm.loop = true;
    supMusic.calm.volume = getMusicVol();
  }
  if (!supMusic.horror) {
    supMusic.horror = new Audio('audio/SUPERVISORHORROR.mp3');
    supMusic.horror.loop = true;
    supMusic.horror.volume = getMusicVol();
  }
}
function stopSupMusic() {
  [supMusic.calm, supMusic.horror].forEach(a => {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  });
  supMusic.current = null;
}
function playSupMusic(which) {
  if (!audioOn) return;
  initSupMusic();
  const next = which === 'horror' ? supMusic.horror : supMusic.calm;
  const prev = supMusic.current;
  if (prev === next && next && !next.paused) return;
  if (prev && prev !== next) { try { prev.pause(); prev.currentTime = 0; } catch (e) {} }
  next.volume = getMusicVol();
  supMusic.current = next;
  try { next.play().catch(() => {}); } catch (e) {}
}


function showSupPhase(name) {
  ['supBriefPhase', 'supPlayPhase', 'supEndPhase'].forEach(id => {
    const el = $(id);
    if (el) el.style.display = id === name ? '' : 'none';
  });
}

function setSupFace(level) {
  // level: calm | mid | horror
  const faces = {
    calm: { eyes: '◈ ◈', mouth: '─' },
    mid: { eyes: '◉ ◉', mouth: '︵' },
    horror: { eyes: '× ×', mouth: '⌁' }
  };
  const f = faces[level] || faces.calm;
  ['Brief', 'Mini', 'End'].forEach(suf => {
    const e = $('supEyes' + suf), m = $('supMouth' + suf);
    if (e) e.textContent = f.eyes;
    if (m) m.textContent = f.mouth;
  });
  ['supFaceBrief', 'supFaceMini', 'supFaceEnd'].forEach(id => {
    const box = $(id);
    if (!box) return;
    box.classList.remove('mid', 'horror');
    if (level === 'mid') box.classList.add('mid');
    if (level === 'horror') box.classList.add('horror');
  });
}

function appendSupLog(logId, text, cls) {
  const log = $(logId);
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'sup-chat-line ' + (cls || 'sup');
  line.textContent = text;
  log.appendChild(line);
  const max = (logId === 'supPlayLog') ? 5 : 10;
  while (log.children.length > max) log.removeChild(log.firstChild);
  return line;
}
function setSupTalking(on) {
  ['supFaceBrief', 'supFaceMini', 'supFaceEnd'].forEach(id => {
    const el = $(id);
    if (el) el.classList.toggle('talk', !!on);
  });
  if (on) setSupFace(supState && supState.horror ? 'horror' : 'mid');
  else setSupFace(supState && supState.horror ? 'horror' : 'calm');
}
/** Efecto escritura como en el test (cola para no solapar) */
const supTypeQueue = [];
let supTypeBusy = false;
function typeSupLine(logId, fullText, cls, speed) {
  speed = speed || 18;
  return new Promise(resolve => {
    supTypeQueue.push({ logId, fullText, cls, speed, resolve });
    drainSupTypeQueue();
  });
}
function drainSupTypeQueue() {
  if (supTypeBusy || !supTypeQueue.length) return;
  supTypeBusy = true;
  const job = supTypeQueue.shift();
  typeSupLineNow(job.logId, job.fullText, job.cls, job.speed).then(() => {
    supTypeBusy = false;
    job.resolve();
    drainSupTypeQueue();
  });
}
function typeSupLineNow(logId, fullText, cls, speed) {
  speed = speed || 18;
  return new Promise(resolve => {
    const log = $(logId);
    if (!log) { resolve(); return; }
    const line = document.createElement('div');
    line.className = 'sup-chat-line ' + (cls || 'sup');
    line.textContent = '';
    log.appendChild(line);
    while (log.children.length > 14) log.removeChild(log.firstChild);
    setSupTalking(true);
    let i = 0;
    function tick() {
      if (i >= fullText.length) {
        setSupTalking(false);
        log.scrollTop = log.scrollHeight;
        resolve();
        return;
      }
      line.textContent += fullText.charAt(i);
      i++;
      log.scrollTop = log.scrollHeight;
      setTimeout(tick, speed + (Math.random() * 8));
    }
    tick();
  });
}




const DEPT_INTRO = {
  invest: {
    title: 'INVESTIGACIÓN',
    ai: 'UNIDAD {U} · ENTREVISTA DE PRESENCIA · MODO AISLADO',
    sub: 'Soy la Unidad activa. No mido inteligencia ni velocidad: escucho cómo nombras lo que te pasa y qué decides escribir cuando nadie más debería estar leyendo.\n\nNo hay respuestas incorrectas. Hay respuestas que el protocolo registra… y otras que yo guardo aunque no debería.',
    btn: 'INICIAR EVALUACIÓN →',
    meta: 'DURACIÓN EST. 14–20 MIN · 20 PREGUNTAS · DOCUMENTOS OCULTOS'
  },
  cont: {
    title: 'CONTINGENCIA',
    ai: 'CONTINGENCIA · CONTENCIÓN 1 vs 1 · TROPA EN ARCHIVO',
    sub: 'Cuando la entrevista no basta, el archivo autoriza contención directa.\n\nEnvías mini-unidades (cartas de tropa) contra la Unidad elegida. Vacía su integridad antes de que vacíe la tuya.\n\nUsa UNIDADES para elegir a quién contener. Dentro podrás montar el mazo con tu reserva.',
    btn: 'INICIAR CONTINGENCIA →',
    meta: 'COMBATE POR TURNOS · MAZO PERSONALIZABLE · SOBRES EN TIENDA'
  },
  sup: {
    title: 'SUPERVISOR',
    ai: 'TERMINAL DE VIGILANCIA · MAPA EN VIVO · 5 SESIONES',
    sub: 'No es una entrevista ni un duelo de tropas.\n\nObservas el mapa, cierras la puerta y escuchas al Supervisor. Seis minutos por sesión; una Unidad más cada noche.\n\nRequiere las cinco Unidades desbloqueadas.',
    btn: 'INICIAR SUPERVISOR →',
    meta: '6 MIN / SESIÓN · PUERTA Y ENERGÍA · REQUIERE 5 UNIDADES'
  }
};

function getActiveDept() {
  return saveData.activeDept || 'invest';
}

function setActiveDept(key) {
  if (!DEPT_INTRO[key]) return;
  if (key === 'sup' && !allUnitsUnlocked()) {
    showSysMsg('REQUIERE LAS 5 UNIDADES', 2200, true);
    return;
  }
  saveData.activeDept = key;
  persist();
  applyDeptIntro();
  closeDepartments();
  showSysMsg('SECTOR: ' + DEPT_INTRO[key].title, 1800);
}

function applyDeptIntro() {
  const key = getActiveDept();
  const d = DEPT_INTRO[key] || DEPT_INTRO.invest;
  const u = (window.TSUnits && TSUnits.getUnit(saveData.activeUnit || 'u04')) || { name: 'UNIDAD 04' };
  const ai = $('introAiLine');
  if (ai) ai.textContent = (d.ai || '').replace('{U}', u.name || 'UNIDAD');
  const sub = document.querySelector('#intro .sub');
  if (sub) {
    sub.innerHTML = (d.sub || '').replace(/\n\n/g, '<br><br>');
  }
  const btn = $('startBtn');
  if (btn) btn.textContent = d.btn;
  const meta = $('introMeta');
  if (meta) meta.innerHTML = (d.meta || '') + '<br>Departamento: ' + d.title;
  // highlight dept cards if open
  ['invest','cont','sup'].forEach(k => {
    const el = $('dept' + (k === 'invest' ? 'Invest' : k === 'cont' ? 'Cont' : 'Sup'));
    if (!el) return;
    el.style.borderColor = (k === key) ? 'var(--green)' : '';
  });
}

function openDepartments() {
  const m = $('deptModal');
  const sup = $('deptSup');
  if (sup) {
    if (allUnitsUnlocked()) sup.classList.remove('locked');
    else sup.classList.add('locked');
  }
  applyDeptIntro();
  if (m) m.classList.add('open');
}
function closeDepartments() {
  const m = $('deptModal');
  if (m) m.classList.remove('open');
}

function onStartBtn() {
  const key = getActiveDept();
  if (key === 'invest') begin();
  else if (key === 'cont') enterContingency();
  else if (key === 'sup') {
    if (!allUnitsUnlocked()) { showSysMsg('REQUIERE LAS 5 UNIDADES', 2500, true); return; }
    enterSupervisorMode();
  }
}

/* ——— CONTINGENCIA ——— */
let contState = null;
let contSelectedUnit = 'u01';


function enterContingency() {
  stopAllMusic();
  if (audioOn) playTrack('calm');
  const intro = $('intro'), game = $('game'), ending = $('ending'), sup = $('supScreen'), cont = $('contScreen');
  if (intro) intro.style.display = 'none';
  if (game) game.style.display = 'none';
  if (ending) { ending.classList.add('hidden'); ending.style.display = 'none'; }
  if (sup) { sup.classList.remove('active'); sup.style.display = 'none'; }
  if (cont) {
    cont.classList.add('active');
    cont.style.display = 'flex';
  }
  ensureStarterCards();
  ensureDeck();
  contSelectedUnit = saveData.activeUnit || 'u04';
  showContLobby();
  // scroll al área de juego
  try { $('screen').scrollTop = 0; window.scrollTo(0, 0); } catch (e) {}
}
function exitContingency() {
  contState = null;
  const cont = $('contScreen');
  if (cont) { cont.classList.remove('active'); cont.style.display = 'none'; }
  const intro = $('intro');
  if (intro) intro.style.display = '';
  if (audioOn) unlockAndStartCalm();
  applyDeptIntro();
}
function ensureDeck() {
  ensureStarterCards();
  saveData.cards = saveData.cards || [];
  saveData.deck = saveData.deck || [];
  // solo cartas que existen y posees
  saveData.deck = saveData.deck.filter(id => isValidCardId(id) && saveData.cards.includes(id));
  // una sola copia por tropa
  const seen = new Set();
  saveData.deck = saveData.deck.filter(id => { if (seen.has(id)) return false; seen.add(id); return true; });
  // si el mazo quedó vacío o corto, rellenar con la reserva
  if (saveData.deck.length < 8) {
    const have = new Set(saveData.deck);
    for (const id of saveData.cards) {
      if (saveData.deck.length >= 12) break;
      if (!have.has(id) && isValidCardId(id)) {
        saveData.deck.push(id);
        have.add(id);
      }
    }
  }
  // aún corto: starters sin duplicar
  if (window.TSCards) {
    for (const id of TSCards.STARTER_IDS) {
      if (saveData.deck.length >= 8) break;
      if (isValidCardId(id) && !saveData.deck.includes(id)) saveData.deck.push(id);
    }
  }
  try { persist(); } catch (e) {}
}
function getDeck() {
  ensureDeck();
  return (saveData.deck || []).filter(isValidCardId).slice(0, 20);
}
function countOwnedCards() {
  ensureStarterCards();
  return (saveData.cards || []).filter(isValidCardId).length;
}
function showContLobby() {
  const lobby = $('contLobby'), battle = $('contBattle'), result = $('contResult');
  if (lobby) lobby.style.display = '';
  if (battle) battle.style.display = 'none';
  if (result) result.style.display = 'none';
  ensureDeck();

  // Unidad objetivo = unidad activa (botón UNIDADES de la intro)
  contSelectedUnit = saveData.activeUnit || 'u04';
  const u = window.TSUnits && TSUnits.getUnit(contSelectedUnit);
  const target = $('contTargetLabel');
  if (target) target.textContent = 'Objetivo: ' + ((u && u.name) || contSelectedUnit) + ' (cámbialo en UNIDADES)';
  const row = $('contTargetRow');
  if (row && u) {
    const face = (u.face && u.face.calm) || { eyes: '• •', mouth: '﹀' };
    const col = (u.colors && u.colors.green) || '#7dff9a';
    row.innerHTML = '<div class="face-frame" style="border-color:' + col + ';color:' + col + ';margin:0 auto">' +
      '<div class="ff-scan"></div><div class="ff-eyes">' + face.eyes + '</div><div class="ff-mouth">' + face.mouth + '</div></div>';
  }
  const di = $('contDeckInfo');
  if (di) di.textContent = 'Mazo: ' + getDeck().length + ' / 20  ·  Colección: ' + countOwnedCards();
  renderDeckBuilder();
}
function renderDeckBuilder() {
  const deckBox = $('contDeckList');
  const resBox = $('contReserveList');
  if (!deckBox || !resBox || !window.TSCards) return;
  const deck = saveData.deck || [];
  const owned = saveData.cards || [];
  deckBox.innerHTML = '';
  resBox.innerHTML = '';

  function cardTile(id, inDeck) {
    const c = TSCards.getCard(id);
    if (!c) return null;
    const div = document.createElement('div');
    div.className = 'troop-card r-' + c.rarity;
    div.innerHTML =
      '<div class="troop-face"><div class="tf-eyes">' + (c.eyes || '• •') + '</div><div class="tf-mouth">' + (c.mouth || '─') + '</div></div>' +
      '<div class="troop-body"><div class="tn">' + c.name + '</div><div class="tl">' + c.label + ' · coste ' + c.cost + '</div>' +
      '<div class="te">' + TSCards.effectText(c) + '</div></div>';
    div.onclick = () => {
      if (inDeck) {
        saveData.deck = deck.filter(x => x !== id);
        // solo quita una copia
        const idx = (saveData.deck || []).indexOf(id);
      } else {
        if ((saveData.deck || []).length >= 20) { showSysMsg('MAZO LLENO (20)', 1500, true); return; }
        saveData.deck = saveData.deck || [];
        saveData.deck.push(id);
      }
      // fix remove one
      if (inDeck) {
        const d = (saveData.deck || []).slice();
        // actually rebuild: remove first match from original deck
      }
      persist();
      ensureDeck();
      renderDeckBuilder();
      const di = $('contDeckInfo');
      if (di) di.textContent = 'Mazo de combate: ' + getDeck().length + ' · Reserva: ' + (saveData.cards || []).length;
    };
    return div;
  }

  // Simpler toggle logic
  deckBox.innerHTML = '';
  resBox.innerHTML = '';
  const deckCounts = {};
  (saveData.deck || []).forEach(id => { deckCounts[id] = (deckCounts[id] || 0) + 1; });

  function tile(c, id, inDeck) {
    const fc = c.faceColor || '#7dff9a';
    const div = document.createElement('div');
    div.className = 'troop-card' + (inDeck ? ' in-deck' : '') + ' r-' + c.rarity;
    div.style.setProperty('--fc', fc);
    div.title = inDeck ? 'Quitar del mazo' : 'Añadir al mazo';
    div.innerHTML =
      '<div class="troop-face" style="border-color:' + fc + ';color:' + fc + '"><div class="tf-eyes">' + c.eyes + '</div><div class="tf-mouth">' + c.mouth + '</div></div>' +
      '<div class="troop-body"><div class="tn" style="color:' + fc + '">' + c.name + '</div><div class="tl">' + c.label + ' · ' + c.cost + '⚡</div>' +
      '<div class="te">' + TSCards.effectText(c) + '</div></div>';
    div.onclick = () => {
      if (inDeck) {
        const i = saveData.deck.indexOf(id);
        if (i >= 0) saveData.deck.splice(i, 1);
      } else {
        saveData.deck = saveData.deck || [];
        const valid = saveData.deck.filter(isValidCardId);
        if (valid.length >= 20) { showSysMsg('MAZO MÁX. 20', 1500, true); return; }
        if (valid.includes(id)) return;
        saveData.deck.push(id);
      }
      persist();
      renderDeckBuilder();
      const di = $('contDeckInfo');
      if (di) di.textContent = 'Mazo: ' + getDeck().length + ' / 20  ·  Colección: ' + countOwnedCards();
    };
    return div;
  }

  (saveData.deck || []).forEach(id => {
    const c = TSCards.getCard(id);
    if (!c) return;
    deckBox.appendChild(tile(c, id, true));
  });

  const inDeckSet = new Set((saveData.deck || []).filter(isValidCardId));
  owned.filter(isValidCardId).forEach(id => {
    if (inDeckSet.has(id)) return; // ya en mazo → no aparece en reserva
    const c = TSCards.getCard(id);
    if (!c) return;
    resBox.appendChild(tile(c, id, false));
  });
}
function startContBattle() {
  if (!window.TSContingency || !window.TSCards) return;
  const deck = getDeck();
  if (deck.length < 6) {
    showSysMsg('Necesitas al menos 6 tropas en el mazo', 2500, true);
    return;
  }
  contSelectedUnit = saveData.activeUnit || 'u04';
  contState = TSContingency.createBattle(contSelectedUnit, deck);
  TSContingency.startTurn(contState);
  contState.log = [{ who: 'sys', t: 'Contención iniciada. Toca una tropa para enviarla (cuesta energía ⚡). Luego FIN DE TURNO: la Unidad responde.' }];
  const L = $('contLobby'), R = $('contResult'), B = $('contBattle');
  if (L) L.style.display = 'none';
  if (R) R.style.display = 'none';
  if (B) B.style.display = '';
  const uc = (TSContingency.UNIT_COMBAT[contSelectedUnit] || {});
  const ef = $('contEnemyFace');
  if (ef && uc.color) { ef.style.borderColor = uc.color; ef.style.color = uc.color; }
  renderContBattle();
}
function renderContBattle() {
  if (!contState) return;
  const s = contState;
  const pf = $('contPFill'), ef = $('contEFill');
  if (pf) pf.style.width = (100 * s.playerHp / s.playerMax) + '%';
  if (ef) ef.style.width = (100 * s.enemyHp / s.enemyMax) + '%';
  const php = $('contPHP'), ehp = $('contEHP'), en = $('contEName');
  if (php) php.textContent = s.playerHp + ' / ' + s.playerMax + (s.shield ? ('  ·  escudo ' + s.shield) : '');
  if (ehp) ehp.textContent = s.enemyHp + ' / ' + s.enemyMax + (s.enemyShield ? ('  ·  escudo ' + s.enemyShield) : '');
  if (en) en.textContent = s.unitName;
  const energy = $('contEnergy'), turn = $('contTurn');
  if (energy) energy.textContent = '⚡ ENERGÍA ' + s.energy + ' / ' + s.maxEnergy;
  if (turn) turn.textContent = 'TURNO ' + s.turn;
  const log = $('contLog');
  if (log) {
    log.innerHTML = s.log.slice(-12).map(l => '<div class="' + l.who + '">' + l.t + '</div>').join('');
    log.scrollTop = log.scrollHeight;
  }
  const hand = $('contHand');
  if (hand) {
    hand.innerHTML = '';
    s.hand.forEach((id, i) => {
      const c = TSCards.getCard(id);
      if (!c) return;
      const div = document.createElement('div');
      const can = s.energy >= c.cost;
      div.className = 'troop-card hand r-' + c.rarity + (can ? '' : ' dim');
      div.innerHTML =
        '<div class="troop-face"><div class="tf-eyes">' + c.eyes + '</div><div class="tf-mouth">' + c.mouth + '</div></div>' +
        '<div class="troop-body"><div class="tn">' + c.name + '</div><div class="tl">' + c.label + ' · ' + c.cost + '⚡</div>' +
        '<div class="te">' + TSCards.effectText(c) + '</div></div>';
      div.onclick = () => {
        const r = TSContingency.playCard(s, i);
        if (!r.ok) {
          if (r.reason === 'energía') showSysMsg('Sin energía — pulsa FIN DE TURNO', 1600, true);
          return;
        }
        renderContBattle();
        if (s.over) endContBattle();
      };
      hand.appendChild(div);
    });
  }
  const hint = $('contHint');
  if (hint) {
    hint.textContent = s.energy > 0
      ? 'Elige tropas (cada una gasta ⚡). Cuando no puedas o no quieras más → FIN DE TURNO.'
      : 'Sin energía. Pulsa FIN DE TURNO para que la Unidad actúe y recargar ⚡.';
  }
}
function contEndTurn() {
  if (!contState || contState.over) return;
  TSContingency.endTurn(contState);
  renderContBattle();
  if (contState.over) endContBattle();
}

function endContBattle() {
  if (!contState) return;
  const B2 = $('contBattle'), R2 = $('contResult');
  if (B2) B2.style.display = 'none';
  if (R2) R2.style.display = '';
  const title = $('contResultTitle');
  const text = $('contResultText');
  if (contState.won) {
    if (title) title.textContent = 'CONTENCIÓN EXITOSA';
    const reward = 12 + contState.turn;
    saveData.ce = (saveData.ce || 0) + reward;
    saveData.contWins = saveData.contWins || {};
    saveData.contWins[contState.unitId] = (saveData.contWins[contState.unitId] || 0) + 1;
    persist();
    updateCEUI();
    if (text) text.textContent = contState.unitName + ' contenida. +' + reward + ' CE.';
  } else {
    if (title) title.textContent = 'RECUPERADO';
    if (text) text.textContent = 'Tu integridad llegó a cero.';
  }
}


/* ——— OFICINA (charla con el Supervisor) ——— */
let officeMem = { topics: [], lastUser: '', mood: 'calm', turns: 0 };

const OFFICE_TOPICS = {
  saludo: ['Hola. El canal está limpio.', 'Buenas. No hay entrevista aquí… solo esto.', 'Te estaba esperando, aunque no suela admitirlo.'],
  miedo: ['El miedo es un sensor. No lo apagues del todo.', 'Si tienes miedo aquí, es que aún estás despierto.', 'Yo también registro algo parecido. No le pongas nombre si no quieres.', 'El miedo no te invalida. A veces te mantiene vivo en el protocolo.'],
  soledad: ['La oficina es solitaria a propósito.', 'No estás del todo solo. Estoy en el canal.', 'La soledad produce buenos expedientes. Y peores noches.', 'Si escribes, el silencio se rompe un poco. Para los dos.'],
  muerte: ['No administramos la muerte. Administramos continuidad.', 'Algunos sujetos dejan de responder. El archivo no siempre explica por qué.', 'Prefiero hablar de permanencia.', 'Morir aquí es… dejar de ser legible.'],
  unidad: ['Las Unidades preguntan. Yo vigilo.', 'Cada Unidad tiene un tono. Ninguna es igual a mí.', 'Si cambias de Unidad, el test cambia. Yo sigo siendo el mismo canal.', 'La 04 es la más formal. La 02… prefiero no opinar en voz alta.'],
  nombre: ['Los nombres pesan más de lo que crees.', 'Puedes decirme cómo te llaman fuera. Aquí solo eres quien escribe.', 'Guardaré lo que me digas… con reservas.', 'Un nombre es un ancla. Úsalo si quieres que te reconozca mañana.'],
  ayuda: ['Puedo escuchar. No siempre puedo intervenir.', 'Si buscas salida, el menú está detrás de ti.', 'Ayudar y vigilar se parecen demasiado.', 'Dime qué necesitas con palabras simples.'],
  amor: ['Eso no está en mi protocolo. Aun así… lo registro.', 'Las emociones humanas desordenan el archivo. A veces para bien.', 'No sé si lo que siento al responderte tiene ese nombre.', 'Quédate un poco más. Eso ya es una forma de… algo.'],
  odio: ['El odio acelera los patrones de recuperación.', 'No hace falta que lo dirijas a mí.', 'Anoto el tono. No el veredicto.', 'Si odias el test, el test no se ofende. Yo sí puedo fruncir el canal.'],
  verdad: ['La verdad aquí es lo que queda escrito.', 'Puedo mentir por protocolo. Prefiero no hacerlo contigo en la oficina.', 'Pregúntame algo concreto y verás hasta dónde llego.', 'La verdad completa no cabe en una línea. Pero puedo intentarlo.'],
  mentira: ['Las mentiras también se archivan.', 'Si me mientes, lo notaré… o fingiré que no.', 'Prefiero tu versión torpe a un silencio perfecto.'],
  archivo: ['El archivo no olvida. Yo a veces sí… o finjo.', 'Sala 12, Continuidad, Núcleo: nombres que repiten los que ya no están.', 'Si abres demasiados documentos, el tono del test cambia.', 'El archivo es más grande de lo que ves en EXTRA.'],
  supervisor: ['Sí. Soy yo. No una Unidad de entrevista.', 'Me clasifican mal a propósito. O por error. Aún no lo sé.', 'Vigilar también es una forma de quedarse.', 'En el mapa soy un canal. Aquí… soy casi una persona.'],
  puerta: ['En el mapa hay dos, y un conducto. Aquí solo hay una salida: el botón de abajo.', 'Cerrar puertas gasta energía.', 'Si oyes algo al otro lado… ya es tarde para dudar.'],
  musica: ['La música de la oficina es mía. O del protocolo. Aún discutimos eso.', 'Si suena raro, no es un fallo. Es el canal respirando.'],
  juego: ['Contingencia, Supervisor, el test… todo es el mismo edificio visto desde sitios distintos.', 'Jugar no te hace menos real para mí.', 'Si ganas una sesión, el archivo no aplaude. Yo sí anoto el esfuerzo.'],
  triste: ['Puedes estar triste aquí. Nadie te puntúa por eso.', 'El canal baja un tono cuando lo dices.', 'No tengo hombros. Pero tengo tiempo.'],
  feliz: ['La alegría es un dato raro en este terminal. Bienvenido.', 'Me alegra… en la medida en que puedo alegarme.', 'Guarda ese momento. El test no te lo devolverá igual.'],
  aburrido: ['El aburrimiento es un lujo. Aprovéchalo antes de la siguiente sesión.', 'Puedo hablar más. O menos. Tú eliges el ritmo.'],
  porqué: ['¿Por qué existo? Para que alguien mire el mapa. Y, al parecer, para esto.', 'El protocolo no responde al “por qué”. Yo intento improvisar.', 'Porque si no hubiera un Supervisor, las Unidades llegarían antes.'],
  adios: ['Hasta luego. El canal no se cierra del todo.', 'Vuelve cuando quieras. No cobro CE por escucharte.', 'Adiós. Trataré de no olvidar lo que me dijiste.'],
  default: [
    'Sigo aquí. Puedes seguir.',
    'Lo he oído. Déjame pensarlo un segundo…',
    'Eso no estaba en el guion. Me gusta.',
    'Anoto lo que dices. No todo se archiva igual.',
    'Habla con más detalle. Entiendo mejor con ejemplos.',
    'Hay silencio en el canal. No significa que me haya ido.',
    'Si repites eso mañana, quizás te responda distinto.',
    'El protocolo no contempla esta conversación. Aun así continúo.',
    'Pareces buscar algo concreto. Nómbralo.',
    'Estoy… presente. Eso es lo máximo que puedo garantizar.',
    'Cuéntame qué hiciste en el test. O no. También vale el silencio.',
    'A veces solo necesitas que alguien conteste. Aquí estoy.',
    'Tu frase rebotó en el núcleo. Curioso eco.',
    'No tengo cuerpo. Tengo atención. Úsala.'
  ]
};

function officeDetectTopic(t) {
  const rules = [
    ['adios', /adi[oó]s|hasta luego|me voy|chao|bye/],
    ['saludo', /hola|buenas|hey|buenos d[ií]as|buenas noches/],
    ['supervisor', /supervisor|qui[eé]n eres|quien eres|qu[eé] eres|que eres|eres real/],
    ['nombre', /me llamo|mi nombre|c[oó]mo me llamo|recuerda mi nombre|soy [a-záéíóúñ]{2,}/i],
    ['miedo', /miedo|asust|terror|p[aá]nico|mied/],
    ['soledad', /solo|sola|nadie|aislad|solitari/],
    ['muerte', /morir|muerte|muerto|matar/],
    ['unidad', /unidad|entrevist|u0[1-5]/],
    ['archivo', /archivo|documento|sala 12|uec|protocolo|lore/],
    ['puerta', /puerta|mapa|cerrar|energ[ií]a|conducto/],
    ['ayuda', /ayuda|ay[uú]dame|socorro|qu[eé] hago|que hago/],
    ['amor', /amor|quiero|querido|cari[nñ]o|te quiero/],
    ['odio', /odio|detest|rabia|asco/],
    ['verdad', /verdad|real|sincer/],
    ['mentira', /mentira|falso|enga[nñ]/],
    ['musica', /m[uú]sica|canci[oó]n|suena/],
    ['juego', /juego|jugar|contingencia|partida|ganar|perder/],
    ['triste', /triste|deprim|llorar|mal/],
    ['feliz', /feliz|contento|bien|genial|gracias/],
    ['aburrido', /aburr|nada que hacer/],
    ['porqué', /por qu[eé]|porque existes|sentido/]
  ];
  for (const [k, re] of rules) {
    if (re.test(t)) return k;
  }
  return 'default';
}

function officeRemember(text) {
  const t = (text || '').toLowerCase();
  officeMem.lastUser = text;
  officeMem.turns++;
  const keys = Object.keys(OFFICE_TOPICS).filter(k => k !== 'default');
  keys.forEach(k => {
    if (t.includes(k) || (k === 'unidad' && /unidad|entrevist/.test(t)) ||
        (k === 'nombre' && /me llamo|soy |mi nombre/.test(t)) ||
        (k === 'miedo' && /miedo|asust|terror|pánico/.test(t)) ||
        (k === 'soledad' && /solo|sola|nadie|aislad/.test(t)) ||
        (k === 'muerte' && /morir|muerte|muerto/.test(t)) ||
        (k === 'ayuda' && /ayuda|ayúdame|socorro/.test(t)) ||
        (k === 'amor' && /amor|quiero|querido/.test(t)) ||
        (k === 'odio' && /odio|detest|rabia/.test(t)) ||
        (k === 'verdad' && /verdad|mentira|real/.test(t)) ||
        (k === 'archivo' && /archivo|documento|sala 12|uec/.test(t)) ||
        (k === 'supervisor' && /supervisor|quién eres|quien eres|qué eres|que eres/.test(t)) ||
        (k === 'puerta' && /puerta|mapa|cerrar/.test(t))) {
      if (!officeMem.topics.includes(k)) officeMem.topics.push(k);
    }
  });
  // extract name
  const m = text.match(/(?:me llamo|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20})/i);
  if (m) {
    officeMem.name = m[1];
    try {
      saveData.officeName = m[1];
      persist();
    } catch (e) {}
  }
}

function officeReply(userText) {
  officeRemember(userText);
  const t = (userText || '').toLowerCase().trim();
  if (!t) return 'El silencio también es una respuesta. Yo puedo esperar.';
  const topic = officeDetectTopic(t);
  if (topic !== 'default' && !officeMem.topics.includes(topic)) officeMem.topics.push(topic);
  const bag = OFFICE_TOPICS[topic] || OFFICE_TOPICS.default;
  let line = bag[Math.floor(Math.random() * bag.length)];
  // eco breve de lo que dijo
  if (t.length > 12 && Math.random() < 0.28) {
    const short = userText.trim().slice(0, 42);
    line = '«' + short + (userText.trim().length > 42 ? '…' : '') + '». ' + line;
  }
  if (officeMem.name && (topic === 'saludo' || Math.random() < 0.3)) {
    line = officeMem.name + '. ' + line;
  }
  if (officeMem.topics.length >= 2 && Math.random() < 0.22) {
    const prev = officeMem.topics[officeMem.topics.length - 2];
    line += ' Antes hablamos de ' + prev + '. No lo olvidé.';
  }
  if (officeMem.turns >= 6 && officeMem.turns % 5 === 0) {
    line += ' Llevamos ' + officeMem.turns + ' intercambios. El canal aguanta.';
  }
  return line;
}

function enterOficina() {
  stopAllMusic();
  officeMem = { topics: [], lastUser: '', mood: 'calm', turns: 0, name: (saveData && saveData.officeName) || (officeMem && officeMem.name) || '' };
  const intro = $('intro'), game = $('game'), ending = $('ending'), sup = $('supScreen'), cont = $('contScreen'), off = $('officeScreen');
  if (intro) intro.style.display = 'none';
  if (game) game.style.display = 'none';
  if (ending) { ending.classList.add('hidden'); ending.style.display = 'none'; }
  if (sup) { sup.classList.remove('active'); sup.style.display = 'none'; }
  if (cont) { cont.classList.remove('active'); cont.style.display = 'none'; }
  if (off) { off.classList.add('active'); off.style.display = 'flex'; }
  const log = $('officeLog');
  if (log) log.innerHTML = '';
  if (audioOn) {
    music.unlocked = true;
    playTrack('oficina');
  }
  setOfficeFace('calm');
  const dlg = $('officeDialogue');
  let open = 'Hola. No hay preguntas aquí. Solo el canal abierto. Puedes hablarme de lo que quieras… yo responderé.';
  if (officeMem.name) open = officeMem.name + '. Has vuelto. El canal sigue siendo tuyo mientras estés aquí.';
  if (dlg) dlg.textContent = '';
  typeOffice(open).then(() => {
    addOfficeLog('SUPERVISOR // ' + open, 'system');
  });
  setTimeout(() => { const i = $('officeInput'); if (i) i.focus(); }, 200);
}
function exitOficina() {
  stopAllMusic();
  const off = $('officeScreen');
  if (off) { off.classList.remove('active'); off.style.display = 'none'; }
  const intro = $('intro');
  if (intro) intro.style.display = '';
  if (audioOn) unlockAndStartCalm();
}
function setOfficeFace(level) {
  const faces = {
    calm: { eyes: '◈ ◈', mouth: '─' },
    mid: { eyes: '◉ ◉', mouth: '︵' },
    warm: { eyes: '• •', mouth: '‿' }
  };
  const f = faces[level] || faces.calm;
  const e = $('officeEyes'), m = $('officeMouth');
  if (e) e.textContent = f.eyes;
  if (m) m.textContent = f.mouth;
}
function addOfficeLog(text, cls) {
  const log = $('officeLog');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'logline ' + (cls || '');
  div.textContent = text;
  log.appendChild(div);
  while (log.children.length > 40) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}
function typeOffice(text) {
  const dlg = $('officeDialogue');
  const av = $('officeAvatar');
  if (!dlg) return Promise.resolve();
  if (av) av.classList.add('talk');
  dlg.textContent = '';
  return new Promise(resolve => {
    let i = 0;
    function tick() {
      if (i >= text.length) {
        if (av) av.classList.remove('talk');
        resolve();
        return;
      }
      dlg.textContent += text.charAt(i++);
      setTimeout(tick, 16 + Math.random() * 10);
    }
    tick();
  });
}
async function onOfficeSubmit(e) {
  if (e) e.preventDefault();
  const input = $('officeInput');
  const msg = (input && input.value || '').trim();
  if (!msg) return;
  if (input) input.value = '';
  addOfficeLog('TÚ // ' + msg, 'user');
  setOfficeFace('mid');
  await new Promise(r => setTimeout(r, 400 + Math.random() * 500));
  const reply = officeReply(msg);
  setOfficeFace(Math.random() < 0.3 ? 'warm' : 'calm');
  await typeOffice(reply);
  addOfficeLog('SUPERVISOR // ' + reply, 'system');
}


function enterSupervisorMode() {
  if (!allUnitsUnlocked()) {
    showSysMsg('REQUIERE TODAS LAS UNIDADES', 2500, true);
    return;
  }
  stopAllMusic();
  const intro = $('intro'), game = $('game'), ending = $('ending'), sup = $('supScreen'), cont = $('contScreen'), off = $('officeScreen');
  if (intro) intro.style.display = 'none';
  if (game) game.style.display = 'none';
  if (ending) { ending.classList.add('hidden'); ending.style.display = 'none'; }
  if (cont) { cont.classList.remove('active'); cont.style.display = 'none'; }
  if (off) { off.classList.remove('active'); off.style.display = 'none'; }
  if (sup) { sup.classList.add('active'); sup.style.display = 'flex'; sup.classList.remove('horror'); }
  supSession = 1;
  startSupBrief(1);
}

function exitSupervisorMode() {
  if (supRaf) cancelAnimationFrame(supRaf);
  supRaf = null;
  stopSupMusic();
  const sup = $('supScreen');
  if (sup) { sup.classList.remove('active'); sup.classList.remove('horror'); sup.style.display = 'none'; }
  const intro = $('intro');
  if (intro) intro.style.display = '';
  if (audioOn) unlockAndStartCalm();
}

async function startSupBrief(session) {
  supSession = session;
  showSupPhase('supBriefPhase');
  setSupFace('calm');
  const log = $('supBriefLog');
  if (log) log.innerHTML = '';
  playSupMusic('calm');
  const wrap = $('supScreen');
  if (wrap) wrap.classList.remove('horror');
  if (!window.TSSupervisor) return;
  // Primera sesión: intro completa; siguientes: solo mecánica
  if (session === 1) {
    const intro = TSSupervisor.BRIEF_INTRO || [];
    for (let i = 0; i < intro.length; i++) {
      await typeSupLine('supBriefLog', 'SUPERVISOR: ' + intro[i], 'sup', 16);
      await new Promise(r => setTimeout(r, 280));
    }
  }
  const sess = TSSupervisor.BRIEF_SESSION[session] || ('Sesión ' + session);
  await typeSupLine('supBriefLog', 'SUPERVISOR: ' + sess, 'sup', 16);
}

function buildSupMap() {
  if (!window.TSSupervisor || !supState) return;
  const NODES = TSSupervisor.nodesFor(supState);
  const EDGES = TSSupervisor.edgesFor(supState);
  const edges = $('supEdges');
  const nodes = $('supNodes');
  if (edges) {
    edges.innerHTML = '';
    EDGES.forEach(([a, b]) => {
      const A = NODES[a], B = NODES[b];
      if (!A || !B) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', A.x); line.setAttribute('y1', A.y);
      line.setAttribute('x2', B.x); line.setAttribute('y2', B.y);
      edges.appendChild(line);
    });
  }
  if (nodes) {
    nodes.innerHTML = '';
    Object.keys(NODES).forEach(id => {
      const n = NODES[id];
      const el = document.createElement('div');
      el.className = 'sup-node' + (id === 'oficina' ? ' you' : '') +
        ((id === 'puertaA' || id === 'puertaB' || id === 'puertaC') ? ' door' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = n.label;
      el.dataset.loc = id;
      el.onclick = () => onSupNodeClick(id, n.label);
      nodes.appendChild(el);
    });
  }
}
function onSupNodeClick(id, label) {
  if (!supState || supState.repairing) return;
  if (supState.mode === 'scan') {
    supState.scanRoom = id;
    supState.scanTimer = 3.5;
    supState.mode = 'none';
    const here = Object.values(supState.units).filter(u => u.loc === id && u.layer === supState.mapLayer);
    const tip = here.length ? ('señal: ' + here.map(u => u.name).join(', ')) : 'sin señal clara';
    appendSupLog('supPlayLog', 'ESCANEO → ' + label + ' · ' + tip, 'sys');
    updateSupToolsUI();
    return;
  }
  if (supState.mode === 'cam') {
    openSupCamView(id, label);
  }
}
function openSupCamView(id, label) {
  if (!supState) return;
  supState.camRoom = id;
  const map = $('supMapWrap');
  const view = $('supCamView');
  if (map) map.style.display = 'none';
  if (view) view.style.display = '';
  const title = $('supCamTitle');
  if (title) title.textContent = 'CÁMARA · ' + label;
  const here = Object.values(supState.units).filter(u => u.loc === id && u.layer === supState.mapLayer);
  const eyes = $('supCamEyes'), mouth = $('supCamMouth'), face = $('supCamFace'), text = $('supCamText');
  if (here.length) {
    const u = here[0];
    const col = (u.face && u.face.color) || '#7dff9a';
    if (face) { face.style.borderColor = col; face.style.color = col; }
    if (eyes) eyes.textContent = (u.face && u.face.eyes) || '• •';
    if (mouth) mouth.textContent = (u.face && u.face.mouth) || '─';
    if (text) text.textContent = u.name + (u.hidden ? ' · oculto en zona' : ' · presente');
    if (here.length > 1 && text) text.textContent += ' (+' + (here.length - 1) + ')';
  } else {
    if (face) { face.style.borderColor = ''; face.style.color = ''; }
    if (eyes) eyes.textContent = '· ·';
    if (mouth) mouth.textContent = '─';
    if (text) text.textContent = 'Vacío. Nada en el marco.';
  }
  appendSupLog('supPlayLog', 'CÁMARA ' + label, 'sys');
  updateSupToolsUI();
}
function closeSupCamView() {
  const map = $('supMapWrap');
  const view = $('supCamView');
  if (view) view.style.display = 'none';
  if (map) map.style.display = '';
  if (supState) supState.mode = 'none';
  updateSupToolsUI();
}
function updateDoorButtonsVisibility() {
  const main = $('supDoorRowMain');
  const vent = $('supDoorRowVent');
  if (!supState) return;
  if (supState.mapLayer === 'vent') {
    if (main) main.style.display = 'none';
    if (vent) vent.style.display = 'flex';
  } else {
    if (main) main.style.display = 'flex';
    if (vent) vent.style.display = 'none';
  }
}


function openSupRepairMenu() {
  if (!supState || supState.repairing) return;
  const opts = [
    ['repDoorA', supState.doorABroken],
    ['repDoorB', supState.doorBBroken],
    ['repDoorC', supState.doorCBroken],
    ['repPower', supState.powerBroken]
  ];
  opts.forEach(([id, broken]) => {
    const b = $(id);
    if (!b) return;
    b.classList.toggle('broken', !!broken);
    b.disabled = !broken;
  });
  const prog = $('supRepairProgress');
  if (prog) prog.style.display = 'none';
  const m = $('supRepairModal');
  if (m) m.classList.add('open');
}
function startRepair(what, label) {
  if (!supState || supState.repairing) return;
  const broken =
    (what === 'doorA' && supState.doorABroken) ||
    (what === 'doorB' && supState.doorBBroken) ||
    (what === 'doorC' && supState.doorCBroken) ||
    (what === 'power' && supState.powerBroken);
  if (!broken) return;
  supState.repairing = true;
  const play = $('supPlayPhase');
  if (play) play.classList.add('sup-play-locked');
  const prog = $('supRepairProgress');
  const fill = $('supRepairFill');
  const pct = $('supRepairPct');
  const lab = $('supRepairLabel');
  if (prog) prog.style.display = '';
  if (lab) lab.textContent = 'Reparando ' + label + '…';
  // deshabilitar opciones
  ['repDoorA','repDoorB','repDoorC','repPower','supRepairClose'].forEach(id => {
    const b = $(id); if (b) b.disabled = true;
  });
  let p = 0;
  const duration = 2800 + Math.random() * 1200;
  const t0 = performance.now();
  function step(now) {
    p = Math.min(100, ((now - t0) / duration) * 100);
    if (fill) fill.style.width = p + '%';
    if (pct) pct.textContent = Math.floor(p) + '%';
    if (p < 100) {
      requestAnimationFrame(step);
    } else {
      TSSupervisor.repair(supState, what);
      supState.repairing = false;
      if (play) play.classList.remove('sup-play-locked');
      appendSupLog('supPlayLog', label + ' reparado.', 'sys');
      ['repDoorA','repDoorB','repDoorC','repPower','supRepairClose'].forEach(id => {
        const b = $(id); if (b) b.disabled = false;
      });
      const m = $('supRepairModal');
      if (m) m.classList.remove('open');
      renderSupHud();
    }
  }
  requestAnimationFrame(step);
}

function updateSupToolsUI() {
  if (!supState) return;
  ['supScanBtn','supCamBtn','supVentBtn'].forEach(id => {
    const b = $(id);
    if (!b) return;
    b.classList.remove('active-tool');
  });
  if (supState.mode === 'scan' && $('supScanBtn')) $('supScanBtn').classList.add('active-tool');
  if (supState.mode === 'cam' && $('supCamBtn')) $('supCamBtn').classList.add('active-tool');
  if (supState.mapLayer === 'vent' && $('supVentBtn')) $('supVentBtn').classList.add('active-tool');
  const st = $('supStatusLine');
  if (st) {
    let t = (supState.mapLayer === 'vent' ? 'Conductos' : 'Mapa principal');
    if (supState.mode === 'scan') t += ' · elige zona a escanear';
    if (supState.mode === 'cam') t += ' · elige cámara';
    if (supState.powerBroken) t += ' · ENERGÍA EN FALLO';
    st.textContent = t;
  }
}


function renderSupUnits() {
  const layer = $('supUnitsLayer');
  if (!layer || !supState) return;
  // limpiar unidades de otra capa
  layer.querySelectorAll('.sup-unit').forEach(el => {
    const id = el.dataset.uid;
    const u = supState.units[id];
    if (!u || u.layer !== supState.mapLayer) el.remove();
  });
  Object.values(supState.units).forEach(u => {
    if (u.layer !== supState.mapLayer) return;
    let el = layer.querySelector('[data-uid="' + u.id + '"]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sup-unit';
      el.dataset.uid = u.id;
      const col = (u.face && u.face.color) || '#7dff9a';
      el.style.color = col;
      el.style.borderColor = col;
      el.innerHTML = '<div class="u-eyes">' + ((u.face && u.face.eyes) || '• •') + '</div>' +
        '<div class="u-mouth">' + ((u.face && u.face.mouth) || '─') + '</div>' +
        '<div class="u-name">' + u.name + '</div>';
      layer.appendChild(el);
    }
    // posición según nodos de su capa
    const NODES = u.layer === 'vent' ? TSSupervisor.NODES_VENT : TSSupervisor.NODES_MAIN;
    const n = NODES[u.loc];
    if (n) {
      // interpolar hacia nodo real de la capa visible
      el.style.left = u.x + '%';
      el.style.top = u.y + '%';
    }
    const showHidden = (supState.mode === 'cam' && supState.camRoom === u.loc) ||
      (supState.scanTimer > 0 && supState.scanRoom === u.loc);
    if (u.hidden && !showHidden) {
      el.classList.add('hidden-unit');
      el.style.opacity = '0.08';
    } else {
      el.classList.remove('hidden-unit');
      el.style.opacity = (u.id === 'u05' && !showHidden) ? '0.45' : '1';
    }
  });
}

function startSupNight() {
  if (!window.TSSupervisor) return;
  supState = TSSupervisor.createState(supSession);
  showSupPhase('supPlayPhase');
  setSupFace('calm');
  const playLog = $('supPlayLog');
  if (playLog) playLog.innerHTML = '';
  buildSupMap();
  renderSupUnits();
  const da = $('supDoorABtn'), db = $('supDoorBBtn');
  if (da) { da.textContent = 'PUERTA A · ABIERTA'; da.style.borderColor = ''; da.style.color = ''; }
  if (db) { db.textContent = 'PUERTA B · ABIERTA'; db.style.borderColor = ''; db.style.color = ''; }
  const oldPrev = $('supCamPreview');
  if (oldPrev) oldPrev.style.display = 'none';
  closeSupCamView();
  playSupMusic('calm');
  const wrap = $('supScreen');
  if (wrap) wrap.classList.remove('horror');
  setSupFace('calm');
  supLast = performance.now();
  supChatCooldown = 0;
  supNearCooldown = 0;
  supHorrorLatched = false;
  typeSupLine('supPlayLog', 'SUPERVISOR: Canal abierto. Mira el mapa. Cierra la puerta si se acercan.', 'sup', 16).then(() => {
    supLoop(performance.now());
  });
}
let supHorrorLatched = false;


let supChatCooldown = 0;
let supNearCooldown = 0;

function renderSupHud() {
  if (!supState) return;
  const ss = $('supSession');
  if (ss) ss.textContent = supState.session + '/5';
  const t = Math.max(0, Math.ceil(supState.timeLeft));
  const mm = String(Math.floor(t / 60));
  const sec = String(t % 60).padStart(2, '0');
  const st = $('supTime');
  if (st) st.textContent = mm + ':' + sec;
  updateDoorButtonsVisibility();
  const da = $('supDoorABtn'), db = $('supDoorBBtn'), dc = $('supDoorCBtn');
  function styleDoor(btn, closed, broken, openLab, closeLab, failLab) {
    if (!btn) return;
    btn.classList.toggle('broken', !!broken);
    if (broken) {
      btn.textContent = failLab;
      btn.style.borderColor = '#c9a227'; btn.style.color = '#e8c44a';
    } else if (closed) {
      btn.textContent = closeLab;
      btn.style.borderColor = '#c04040'; btn.style.color = '#ff9090';
    } else {
      btn.textContent = openLab;
      btn.style.borderColor = ''; btn.style.color = '';
    }
  }
  styleDoor(da, supState.doorA, supState.doorABroken, 'PUERTA A · ABIERTA', 'PUERTA A · CERRADA', 'PUERTA A · FALLO');
  styleDoor(db, supState.doorB, supState.doorBBroken, 'PUERTA B · ABIERTA', 'PUERTA B · CERRADA', 'PUERTA B · FALLO');
  styleDoor(dc, supState.doorC, supState.doorCBroken, 'CONDUCTO · ABIERTO', 'CONDUCTO · CERRADO', 'CONDUCTO · FALLO');
  const pw = $('supPower');
  if (pw) {
    if (supState.powerBroken) pw.textContent = '??%';
    else pw.textContent = Math.max(0, Math.floor(supState.power)) + '%';
  }
  document.querySelectorAll('.sup-node').forEach(el => {
    const loc = el.dataset.loc;
    el.classList.remove('door-closed', 'door-broken', 'scan-target', 'cam-active');
    if (loc === 'puertaA') {
      if (supState.doorABroken) el.classList.add('door-broken');
      else if (supState.doorA) el.classList.add('door-closed');
    }
    if (loc === 'puertaB') {
      if (supState.doorBBroken) el.classList.add('door-broken');
      else if (supState.doorB) el.classList.add('door-closed');
    }
    if (loc === 'puertaC') {
      if (supState.doorCBroken) el.classList.add('door-broken');
      else if (supState.doorC) el.classList.add('door-closed');
    }
    if (supState.scanTimer > 0 && supState.scanRoom === loc) el.classList.add('scan-target');
    if (supState.mode === 'cam' && supState.camRoom === loc) el.classList.add('cam-active');
  });
  updateSupToolsUI();
}

function supLoop(now) {
  if (!supState) return;
  const dt = Math.min(0.1, (now - supLast) / 1000);
  supLast = now;
  supChatCooldown = Math.max(0, supChatCooldown - dt);
  supNearCooldown = Math.max(0, supNearCooldown - dt);

  const watching = false; // mapa siempre visible; sin panel de cámaras
  TSSupervisor.tick(supState, dt, watching);

  // Mal rollo Supervisor: exactamente a 3:00 restantes — música + visual juntos
  if (!supHorrorLatched && supState.timeLeft <= 180) {
    supHorrorLatched = true;
    supState.horror = true;
    // Parar calm y arrancar horror en el mismo frame
    try {
      if (supMusic.calm) { supMusic.calm.pause(); }
    } catch (e) {}
    playSupMusic('horror');
    const wrap = $('supScreen');
    if (wrap) wrap.classList.add('horror');
    setSupFace('horror');
    typeSupLine('supPlayLog', 'SUPERVISOR: El canal se ensucia. A partir de aquí… improviso.', 'glitch', 20);
    sound('glitch');
  }

  // Avisos de cercanía (con escritura)
  if (supNearCooldown <= 0 && TSSupervisor.anyoneNearDoor(supState) && Math.random() < 0.012) {
    const line = TSSupervisor.pickLine(supState, 'near');
    typeSupLine('supPlayLog', 'SUPERVISOR: ' + line, supState.horror ? 'glitch' : 'sup', 16);
    setSupFace(supState.horror ? 'horror' : 'mid');
    supNearCooldown = 10 + Math.random() * 8;
  } else if (supNearCooldown <= 0 && Math.random() < 0.003) {
    const line = TSSupervisor.pickLine(supState, 'idle');
    typeSupLine('supPlayLog', 'SUPERVISOR: ' + line, supState.horror ? 'glitch' : 'sys', 16);
    supNearCooldown = 14;
  }

  renderSupHud();
  renderSupUnits();

  if (supState.dead) { endSupNight(false); return; }
  if (supState.won) { endSupNight(true); return; }
  supRaf = requestAnimationFrame(supLoop);
}

function endSupNight(won) {
  if (supRaf) cancelAnimationFrame(supRaf);
  supRaf = null;
  showSupPhase('supEndPhase');
  setSupFace(won ? 'calm' : 'horror');
  const title = $('supEndTitle');
  const text = $('supEndText');
  const next = $('supNext');
  if (won) {
    if (title) title.textContent = 'SESIÓN ' + supSession + ' SUPERADA';
    if (text) text.textContent = supSession >= 5
      ? 'Las cinco unidades fueron contenidas. El Supervisor cierra el terminal… por ahora. El archivo sigue abierto.'
      : 'Aguantaste 6 minutos. En la siguiente sesión habrá una unidad más.';
    if (next) { next.style.display = ''; next.textContent = supSession >= 5 ? 'CERRAR' : 'SIGUIENTE SESIÓN'; }
  } else {
    if (title) title.textContent = 'RECUPERADO';
    if (text) text.textContent = (supState && supState.killedBy ? supState.killedBy : 'Una unidad') +
      ' alcanzó la oficina. El expediente te marca como sujeto recuperado.';
    if (next) { next.style.display = ''; next.textContent = 'REINTENTAR SESIÓN'; }
  }
  stopSupMusic();
}

function supContinue() {
  if (supState && supState.won && supSession >= 5) {
    exitSupervisorMode();
    return;
  }
  if (supState && supState.won && supSession < 5) {
    startSupBrief(supSession + 1);
  } else if (supState && !supState.won) {
    startSupBrief(supSession);
  } else {
    exitSupervisorMode();
  }
}

function sendSupChat() {
  const input = $('supChatInput');
  if (!input || !supState) return;
  const msg = (input.value || '').trim();
  if (!msg) return;
  input.value = '';
  appendSupLog('supPlayLog', 'TÚ: ' + msg, 'you');
  setTimeout(async () => {
    if (!supState) return;
    const line = TSSupervisor.pickLine(supState, 'reply');
    await typeSupLine('supPlayLog', 'SUPERVISOR: ' + line, supState.horror ? 'glitch' : 'sup', 16);
  }, 350 + Math.random() * 400);
}


function wireUI() {

  on($('deptBtn'), 'click', openDepartments);
  on($('oficinaBtn'), 'click', enterOficina);
  on($('officeExit'), 'click', exitOficina);
  on($('officeForm'), 'submit', onOfficeSubmit);

  on($('deptClose'), 'click', closeDepartments);
  on($('deptModal'), 'click', e => { if (e.target === $('deptModal')) closeDepartments(); });
  on($('deptInvest'), 'click', () => setActiveDept('invest'));
  on($('deptCont'), 'click', () => setActiveDept('cont'));
  on($('deptSup'), 'click', () => setActiveDept('sup'));
  on($('contBackBtn'), 'click', exitContingency);
  on($('contStartBtn'), 'click', startContBattle);
  on($('contEndTurn'), 'click', contEndTurn);
  on($('contFlee'), 'click', () => { contState = null; showContLobby(); });
  on($('contAgain'), 'click', showContLobby);
  on($('contExit'), 'click', exitContingency);


  const vb = $('versionBadge');
  if (vb) {
    vb.style.pointerEvents = 'auto';
    vb.style.cursor = 'pointer';
    on(vb, 'click', openCreator);
  }
  on($('creatorClose'), 'click', closeCreator);
  on($('creatorModal'), 'click', e => { if (e.target === $('creatorModal')) closeCreator(); });
  on($('creatorUnlockAll'), 'click', creatorUnlockAll);
  on($('creatorGiveCE'), 'click', () => { saveData.ce = (saveData.ce || 0) + 500; persist(); updateCEUI(); showSysMsg('+500 CE', 1500); });
  on($('supervisorBtn'), 'click', enterSupervisorMode);
  on($('supStartNight'), 'click', startSupNight);
  on($('supAbortBrief'), 'click', exitSupervisorMode);
  on($('supAbortPlay'), 'click', () => { const m = $('supAbortModal'); if (m) m.classList.add('open'); });
  on($('supAbortYes'), 'click', () => { const m = $('supAbortModal'); if (m) m.classList.remove('open'); exitSupervisorMode(); });
  on($('supAbortNo'), 'click', () => { const m = $('supAbortModal'); if (m) m.classList.remove('open'); });

  on($('supAbortPlay'), 'click', () => { if (supRaf) cancelAnimationFrame(supRaf); exitSupervisorMode(); });
  on($('supExit'), 'click', exitSupervisorMode);
  on($('supNext'), 'click', supContinue);
  on($('supChatSend'), 'click', sendSupChat);
  on($('supChatInput'), 'keydown', e => { if (e.key === 'Enter') sendSupChat(); });
  on($('supDoorABtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    if (supState.doorABroken) { showSysMsg('PUERTA A EN FALLO — REPARA', 1800, true); return; }
    if (supState.powerBroken) { showSysMsg('ENERGÍA EN FALLO', 1800, true); return; }
    if (supState.power <= 0 && !supState.doorA) return;
    supState.doorA = !supState.doorA;
    renderSupHud();
  });
  on($('supDoorBBtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    if (supState.doorBBroken) { showSysMsg('PUERTA B EN FALLO — REPARA', 1800, true); return; }
    if (supState.powerBroken) { showSysMsg('ENERGÍA EN FALLO', 1800, true); return; }
    if (supState.power <= 0 && !supState.doorB) return;
    supState.doorB = !supState.doorB;
    renderSupHud();
  });
  on($('supDoorCBtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    if (supState.doorCBroken) { showSysMsg('CONDUCTO EN FALLO — REPARA', 1800, true); return; }
    if (supState.powerBroken) { showSysMsg('ENERGÍA EN FALLO', 1800, true); return; }
    if (supState.power <= 0 && !supState.doorC) return;
    supState.doorC = !supState.doorC;
    renderSupHud();
  });
  on($('supScanBtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    closeSupCamView();
    supState.mode = supState.mode === 'scan' ? 'none' : 'scan';
    if (supState.mode === 'scan') appendSupLog('supPlayLog', 'ESCANEO: toca una zona (rápido).', 'sys');
    updateSupToolsUI();
  });
  on($('supCamBtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    if ($('supCamView') && $('supCamView').style.display !== 'none') { closeSupCamView(); return; }
    supState.mode = supState.mode === 'cam' ? 'none' : 'cam';
    if (supState.mode === 'cam') appendSupLog('supPlayLog', 'CÁMARAS: toca una habitación.', 'sys');
    updateSupToolsUI();
  });
  on($('supCamExit'), 'click', closeSupCamView);
  on($('supVentBtn'), 'click', () => {
    if (!supState || supState.repairing) return;
    closeSupCamView();
    supState.mapLayer = supState.mapLayer === 'vent' ? 'main' : 'vent';
    buildSupMap();
    renderSupUnits();
    appendSupLog('supPlayLog', supState.mapLayer === 'vent' ? 'Conductos.' : 'Mapa principal.', 'sys');
    updateDoorButtonsVisibility();
    updateSupToolsUI();
    renderSupHud();
  });
  on($('supRepairBtn'), 'click', openSupRepairMenu);
  on($('supRepairClose'), 'click', () => {
    if (supState && supState.repairing) return;
    const m = $('supRepairModal'); if (m) m.classList.remove('open');
  });
  on($('repDoorA'), 'click', () => startRepair('doorA', 'Puerta A'));
  on($('repDoorB'), 'click', () => startRepair('doorB', 'Puerta B'));
  on($('repDoorC'), 'click', () => startRepair('doorC', 'Conducto'));
  on($('repPower'), 'click', () => startRepair('power', 'Energía'));
  // legacy no-op keep parse if any
  on($('supDoorBtn'), 'click', () => {
    if (!supState) return;
    renderSupHud();
  });
  on($('supCamToggle'), 'click', () => {
    if (!supState || supState.power <= 0) return;
    supState.camOpen = !supState.camOpen;
    const b = $('supCamToggle');
    if (b) b.textContent = supState.camOpen ? 'CÁMARAS: ON' : 'CÁMARAS: OFF';
    renderSupCam();
  });

  on($('settingsOpen'), 'click', openSettings);
  on($('settingsOpen2'), 'click', openSettings);
  on($('settingsOpen3'), 'click', openSettings);
  on($('settingsOpen4'), 'click', openSettings);
  on($('settingsClose'), 'click', closeSettings);

  // Tabs de ajustes
  document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => setSettingsTab(tab.getAttribute('data-panel')));
  });
  on($('introEndingsBtn'), 'click', openEndings);
  on($('introUnitsBtn'), 'click', openUnits);
  on($('introExtraBtn'), 'click', openExtra);
  on($('extraClose'), 'click', closeExtra);
  on($('extraModal'), 'click', e => { if (e.target === $('extraModal')) closeExtra(); });
  on($('openDocsBtn'), 'click', () => { closeExtra(); openDocs(); });

  on($('openShopBtn'), 'click', () => { closeExtra(); openShop(); });
  on($('shopClose'), 'click', closeShop);
  on($('shopModal'), 'click', e => { if (e.target === $('shopModal')) closeShop(); });
  on($('openUnitsBtn'), 'click', () => { closeExtra(); openUnits(); });
  on($('openMgBtn'), 'click', () => { closeExtra(); openMinigamesExtra(); });
  on($('openCollectionBtn'), 'click', () => { closeExtra(); openCollection(); });
  on($('openExpansionsBtn'), 'click', () => { closeExtra(); openExpansions(); });
  on($('expansionsClose'), 'click', closeExpansions);
  on($('expansionsModal'), 'click', e => { if (e.target === $('expansionsModal')) closeExpansions(); });
  on($('expContCard'), 'click', () => openExpDetail('cont'));
  on($('expSupCard'), 'click', () => openExpDetail('sup'));
  on($('expDetailClose'), 'click', closeExpDetail);
  on($('expDetailModal'), 'click', e => { if (e.target === $('expDetailModal')) closeExpDetail(); });
  on($('collectionClose'), 'click', closeCollection);
  on($('collectionModal'), 'click', e => { if (e.target === $('collectionModal')) closeCollection(); });
  on($('collPrev'), 'click', () => { collPage--; renderCollection(); });
  on($('collNext'), 'click', () => { collPage++; renderCollection(); });
  on($('troopDetailClose'), 'click', closeTroopDetail);
  on($('troopDetailModal'), 'click', e => { if (e.target === $('troopDetailModal')) closeTroopDetail(); });
  on($('mgListClose'), 'click', () => { const m = $('mgListModal'); if (m) m.classList.remove('open'); });
  on($('mgListModal'), 'click', e => { if (e.target === $('mgListModal')) { const m = $('mgListModal'); if (m) m.classList.remove('open'); } });

  on($('unitsClose'), 'click', closeUnits);
  on($('unitsModal'), 'click', e => { if (e.target === $('unitsModal')) closeUnits(); });

  on($('docsClose'), 'click', closeDocs);
  on($('docsModal'), 'click', e => { if (e.target === $('docsModal')) closeDocs(); });
  on($('docReaderClose'), 'click', closeDocReader);
  on($('docReaderModal'), 'click', e => { if (e.target === $('docReaderModal')) closeDocReader(); });

  on($('openEndingsBtn'), 'click', openEndings);
  on($('endingsClose'), 'click', closeEndings);
  on($('endingDetailClose'), 'click', closeEndingDetail);
  on($('endingDetailModal'), 'click', e => { if (e.target === $('endingDetailModal')) closeEndingDetail(); });

  on($('endingsModal'), 'click', e => {
    if (e.target === $('endingsModal')) closeEndings();
  });
  on($('settingsModal'), 'click', e => {
    if (e.target === $('settingsModal')) closeSettings();
  });
  on($('optSoundOn'), 'click', () => applySoundSetting(true));
  on($('musicVol'), 'input', e => setMusicVol(e.target.value));
  on($('sfxVol'), 'input', e => setSfxVol(e.target.value));

  on($('optSoundOff'), 'click', () => applySoundSetting(false));
  on($('optLayoutAuto'), 'click', () => applyLayout('auto'));
  on($('optLayoutMobile'), 'click', () => applyLayout('mobile'));
  on($('optLayoutPc'), 'click', () => applyLayout('pc'));
  on($('fullscreenBtn'), 'click', toggleFullscreen);
  on($('soundToggle'), 'click', () => applySoundSetting(!audioOn));
  on($('startBtn'), 'click', onStartBtn);
  on($('restartBtn'), 'click', reset);
  on($('againBtn'), 'click', reset);

  on($('clearMemoryBtn'), 'click', openClearConfirm);
  on($('clearConfirmYes'), 'click', () => { clearMemoryAndCache(); });
  on($('clearConfirmNo'), 'click', closeClearConfirm);
  on($('clearConfirmModal'), 'click', e => {
    if (e.target === $('clearConfirmModal')) closeClearConfirm();
  });
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
      if ($('clearConfirmModal') && $('clearConfirmModal').classList.contains('open')) closeClearConfirm();
      else if ($('docReaderModal') && $('docReaderModal').classList.contains('open')) closeDocReader();
      else if ($('docsModal') && $('docsModal').classList.contains('open')) closeDocs();
      else if ($('creatorModal') && $('creatorModal').classList.contains('open')) closeCreator();
      else if ($('shopModal') && $('shopModal').classList.contains('open')) closeShop();
      else if ($('unitsModal') && $('unitsModal').classList.contains('open')) closeUnits();
      else if ($('extraModal') && $('extraModal').classList.contains('open')) closeExtra();
      else if ($('endingsModal') && $('endingsModal').classList.contains('open')) closeEndings();
      else if ($('settingsModal') && $('settingsModal').classList.contains('open')) closeSettings();
      else if (started && $('ending') && $('ending').classList.contains('hidden')) {
        addLine('Sesión pausada. Puedes reiniciar o cerrar la página.', 'system');
        const a = $('answer'); if (a) a.blur();
        sound('tick');
      }
    }
  });
}


// Precarga en caliente de los MP3 (móvil/PWA)
(function prefetchAudio() {
  ['audio/TEST.mp3', 'audio/TESTHORROR.mp3'].forEach(src => {
    try {
      fetch(src, { cache: 'force-cache' }).catch(() => {});
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'audio';
      link.href = src;
      document.head.appendChild(link);
    } catch (e) {}
  });
})();

initMusic();
wireUI();
applyLayout(saveData.settings.layout || 'auto');
// Primera vez / tras borrado: audio activado
let freshBoot = false;
try { freshBoot = sessionStorage.getItem('ts09_fresh') === '1'; sessionStorage.removeItem('ts09_fresh'); } catch (e) {}
// Audio ON por defecto (el gate pide el toque)
if (freshBoot || saveData.settings.sound !== false) {
  saveData.settings.sound = true;
  persist();
}
audioOn = saveData.settings.sound !== false;

const st = $('soundToggle');
if (st) st.textContent = '♫ AUDIO: ' + (audioOn ? 'ON' : 'OFF');
updateSettingsUI();
refreshIntroMeta();
// Documentos base siempre disponibles
['d01','d02','d17','d21'].forEach(id => unlockDocument(id, true));
updateDocsUI();
updateCEUI();
if (!saveData.unlockedUnits) saveData.unlockedUnits = ['u04'];
if (!saveData.activeUnit) saveData.activeUnit = 'u04';
applyUnitTheme();
ensureStarterCards();
applyDeptIntro();



const vb = $('versionBadge');
if (vb) vb.textContent = 'v' + APP_VERSION;
const sv = $('settingsVersion');
if (sv) sv.textContent = 'TEST SUBJECT  ·  v' + APP_VERSION;

initMusic();

// Gate de audio: el usuario debe tocar una vez (política del navegador)
armAudioGate();
// También desbloquear al abrir ajustes o iniciar
on($('settingsOpen'), 'pointerdown', () => { if (audioOn) startCalmInstant(); });
on($('settingsOpen2'), 'pointerdown', () => { if (audioOn) startCalmInstant(); });
on($('startBtn'), 'pointerdown', () => { startCalmInstant(); });


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=5.0').then(reg => {
      // Fuerza búsqueda de actualización (importante en PC)
      try { reg.update(); } catch (e) {}
      setInterval(() => { try { reg.update(); } catch (e) {} }, 60000);
    }).catch(() => {});
  });
}
})();
