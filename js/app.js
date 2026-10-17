/* TEST SUBJECT — App logic BUILD 6.1 */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };
const STORAGE_KEY = 'ts09_save_v7';
const APP_VERSION = '8.1';

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
  const next = which === 'horror' ? music.horror : music.calm;
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
      await fadeVolume(prev, 0, 350);
      try { prev.pause(); prev.currentTime = 0; } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
      next.volume = targetVol;
      music.current = next;
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
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
  [music.calm, music.horror].forEach(a => {
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
  // Si el audio ya está permitido y suena, no mostrar
  if (music.calm && !music.calm.paused) {
    hideAudioGate();
    return;
  }
  function activate(ev) {
    if (ev) {
      try { ev.preventDefault(); } catch (e) {}
      try { ev.stopPropagation(); } catch (e) {}
    }
    startCalmInstant();
    // Segundo intento tras un frame (algunos navegadores móviles)
    requestAnimationFrame(() => startCalmInstant());
    setTimeout(() => {
      if (music.calm && music.calm.paused) startCalmInstant();
      else hideAudioGate();
    }, 120);
    hideAudioGate();
  }
  if (g) {
    g.addEventListener('pointerdown', activate, { once: true });
    g.addEventListener('click', activate, { once: true });
  }
  if (btn) {
    btn.addEventListener('pointerdown', activate, { once: true });
    btn.addEventListener('click', activate, { once: true });
  }
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
  const m = $('endingDetailModal');
  const t = $('endingDetailTitle');
  const b = $('endingDetailBody');
  if (t) t.textContent = '◈ ' + (def.title || 'FINAL');
  if (b) b.textContent = getEndingLore(def);
  if (m) m.classList.add('open');
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

function maybeSwitchHorrorMusic() {
  if (!audioOn || horrorMusicStarted) return;
  // Mal rollo más tarde: ~preguntas 13–15 o tensión alta sostenida
  if (idx >= sessionHorrorAt || unsettling >= 10) {
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
  applyUnitTheme();
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



function openShop() {
  updateCEUI();
  const list = $('shopList');
  if (!list) return;
  list.innerHTML = '';

  const sec = (title) => {
    const h = document.createElement('div');
    h.className = 'shop-section-title';
    h.textContent = title;
    list.appendChild(h);
  };

  sec('DOCUMENTOS');
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
        openShop();
        showSysMsg('DOCUMENTO ADQUIRIDO', 2000);
      };
      div.appendChild(btn);
    }
    list.appendChild(div);
  });

  sec('UNIDADES');
  if (window.TSUnits) {
    TSUnits.listUnits().slice().sort((a,b)=>Number(a.code)-Number(b.code)).forEach(u => {
      if (u.id === 'u04') return;
      const owned = (saveData.unlockedUnits || []).includes(u.id);
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = '<div class="dtitle">' + u.name + ' — ' + u.title + '</div><div class="dcat">' + u.shopBlurb + '</div>' +
        '<div class="price">' + (owned ? 'DESBLOQUEADA' : (u.unlock + ' CE')) + '</div>';
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
          openShop();
          showSysMsg(u.name + ' DISPONIBLE', 2200);
        };
        div.appendChild(btn);
      }
      list.appendChild(div);
    });
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
    const div = document.createElement('div');
    div.className = 'unit-item';
    div.innerHTML = '<div class="dtitle">' + u.name + (active ? ' · ACTIVA' : '') + '</div>' +
      '<div class="dcat">' + u.title + '</div><div class="price">' + (owned ? 'Disponible' : ('Bloqueada · ' + u.unlock + ' CE en tienda')) + '</div>';
    if (owned && !active) {
      const btn = document.createElement('button');
      btn.className = 'button';
      btn.textContent = 'ACTIVAR';
      btn.style.marginTop = '8px';
      btn.onclick = () => {
        saveData.activeUnit = u.id;
        persist();
        applyUnitTheme();
        updateSettingsUI();
        openUnits();
        showSysMsg(u.name + ' ACTIVA', 2000);
      };
      div.appendChild(btn);
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
    const done = (ok, ce, typeId) => {
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
    if (forcedType) {
      const t = TSMinigames.TYPES.find(x => x.id === forcedType) || TSMinigames.TYPES[0];
      t.run(root, (ok, ce) => done(ok, ce, t.id));
    } else {
      const t = TSMinigames.startRandom(root, (ok, ce) => {
        // startRandom doesn't pass type - track via closure
      });
      // re-call with known type
      const pick = TSMinigames.TYPES[Math.floor(Math.random() * TSMinigames.TYPES.length)];
      pick.run(root, (ok, ce) => done(ok, ce, pick.id));
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
function enterSupervisorMode() {
  if (!allUnitsUnlocked()) {
    showSysMsg('REQUIERE TODAS LAS UNIDADES', 2500, true);
    return;
  }
  stopAllMusic();
  const intro = $('intro'), game = $('game'), ending = $('ending'), sup = $('supScreen');
  if (intro) intro.style.display = 'none';
  if (game) game.style.display = 'none';
  if (ending) { ending.classList.add('hidden'); ending.style.display = 'none'; }
  if (sup) { sup.classList.add('active'); sup.style.display = 'flex'; }
  supSession = 1;
  startSupBrief(1);
}
function exitSupervisorMode() {
  if (supRaf) cancelAnimationFrame(supRaf);
  supRaf = null;
  stopSupMusic();
  const sup = $('supScreen');
  if (sup) { sup.classList.remove('active'); sup.style.display = 'none'; }
  const intro = $('intro');
  if (intro) intro.style.display = '';
  if (audioOn) unlockAndStartCalm();
}
function startSupBrief(session) {
  supSession = session;
  showSupPhase('supBriefPhase');
  const t = $('supBriefText');
  const brief = (window.TSSupervisor && TSSupervisor.BRIEF[session]) || ('Sesión ' + session);
  if (t) t.textContent = 'SUPERVISOR:\n\n' + brief + '\n\n«No dejes que te capturen. Si una unidad llega a la oficina con la puerta abierta, el expediente te marca como recuperado.»';
  playSupMusic('calm');
}
function startSupNight() {
  if (!window.TSSupervisor) return;
  supState = TSSupervisor.createState(supSession);
  showSupPhase('supPlayPhase');
  // cámaras
  const cams = $('supCams');
  if (cams) {
    cams.innerHTML = '';
    TSSupervisor.LOCS.filter(l => l !== 'oficina').forEach(loc => {
      const b = document.createElement('button');
      b.className = 'button';
      b.textContent = TSSupervisor.LOC_LABEL[loc] || loc;
      b.onclick = () => {
        if (!supState || !supState.camOpen) return;
        supState.cam = loc;
        renderSupCam();
      };
      cams.appendChild(b);
    });
  }
  const doorBtn = $('supDoorBtn');
  if (doorBtn) doorBtn.textContent = 'CERRAR PUERTA';
  supLast = performance.now();
  playSupMusic('calm');
  supLoop(supLast);
}
function renderSupCam() {
  if (!supState || !window.TSSupervisor) return;
  const v = TSSupervisor.camView(supState);
  const el = $('supCamView');
  if (!el) return;
  if (!supState.camOpen) {
    el.textContent = 'Panel de cámaras cerrado.';
    return;
  }
  let txt = 'CAM · ' + v.label + '\n';
  if (v.units.length) txt += 'Detectado: ' + v.units.join(', ');
  else if (v.hint) txt += v.hint;
  else txt += 'Sin movimiento aparente.';
  el.textContent = txt;
}
function renderSupHud() {
  if (!supState) return;
  const ss = $('supSession');
  if (ss) ss.textContent = supState.session + '/5';
  const t = Math.max(0, Math.ceil(supState.timeLeft));
  const mm = String(Math.floor(t / 60));
  const sec = String(t % 60).padStart(2, '0');
  const st = $('supTime');
  if (st) st.textContent = mm + ':' + sec;
  const pw = $('supPower');
  if (pw) pw.textContent = Math.max(0, Math.floor(supState.power)) + '%';
  const dl = $('supDoorLabel');
  if (dl) dl.textContent = 'PUERTA: ' + (supState.doorClosed ? 'CERRADA' : 'ABIERTA');
  // En oficina: si hay unidades rechazadas no se ve, si poder 0 aviso
  const office = $('supOffice');
  if (office && supState.power <= 0) {
    office.style.borderColor = '#6a3030';
  }
}
function supLoop(now) {
  if (!supState) return;
  const dt = Math.min(0.1, (now - supLast) / 1000);
  supLast = now;
  // Música: primeros 3 min calm, luego horror
  if (supState.timeLeft <= 180 && supMusic.current !== supMusic.horror) {
    playSupMusic('horror');
  }
  const watching = supState.camOpen;
  TSSupervisor.tick(supState, dt, watching);
  renderSupHud();
  if (supState.camOpen) renderSupCam();
  if (supState.dead) {
    endSupNight(false);
    return;
  }
  if (supState.won) {
    endSupNight(true);
    return;
  }
  supRaf = requestAnimationFrame(supLoop);
}
function endSupNight(won) {
  if (supRaf) cancelAnimationFrame(supRaf);
  supRaf = null;
  showSupPhase('supEndPhase');
  const title = $('supEndTitle');
  const text = $('supEndText');
  if (won) {
    if (title) title.textContent = 'SESIÓN ' + supSession + ' SUPERADA';
    if (text) text.textContent = supSession >= 5
      ? 'Las cinco unidades fueron contenidas. El Supervisor cierra el terminal… por ahora. El archivo sigue abierto.'
      : 'Aguantaste 6 minutos. Prepárate: en la siguiente sesión habrá una unidad más.';
    const next = $('supNext');
    if (next) next.style.display = supSession >= 5 ? 'none' : '';
  } else {
    if (title) title.textContent = 'RECUPERADO';
    if (text) text.textContent = (supState && supState.killedBy ? supState.killedBy : 'Una unidad') +
      ' alcanzó la oficina. El expediente te marca como sujeto recuperado. La sesión se reinicia.';
    const next = $('supNext');
    if (next) next.textContent = 'REINTENTAR SESIÓN';
    if (next) next.style.display = '';
  }
  stopSupMusic();
}
function supContinue() {
  if (supState && supState.won && supSession < 5) {
    startSupBrief(supSession + 1);
  } else if (supState && !supState.won) {
    startSupBrief(supSession);
  } else {
    exitSupervisorMode();
  }
}


function wireUI() {

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
  on($('supAbortPlay'), 'click', () => { if (supRaf) cancelAnimationFrame(supRaf); exitSupervisorMode(); });
  on($('supExit'), 'click', exitSupervisorMode);
  on($('supNext'), 'click', supContinue);
  on($('supDoorBtn'), 'click', () => {
    if (!supState || supState.power <= 0) return;
    supState.doorClosed = !supState.doorClosed;
    const b = $('supDoorBtn');
    if (b) b.textContent = supState.doorClosed ? 'ABRIR PUERTA' : 'CERRAR PUERTA';
    renderSupHud();
  });
  on($('supCamToggle'), 'click', () => {
    if (!supState || supState.power <= 0) return;
    supState.camOpen = !supState.camOpen;
    const b = $('supCamToggle');
    if (b) b.textContent = supState.camOpen ? 'CERRAR CÁMARAS' : 'CÁMARAS';
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
  on($('introExtraBtn'), 'click', openExtra);
  on($('extraClose'), 'click', closeExtra);
  on($('extraModal'), 'click', e => { if (e.target === $('extraModal')) closeExtra(); });
  on($('openDocsBtn'), 'click', () => { closeExtra(); openDocs(); });

  on($('openShopBtn'), 'click', () => { closeExtra(); openShop(); });
  on($('shopClose'), 'click', closeShop);
  on($('shopModal'), 'click', e => { if (e.target === $('shopModal')) closeShop(); });
  on($('openUnitsBtn'), 'click', () => { closeExtra(); openUnits(); });
  on($('openMgBtn'), 'click', () => { closeExtra(); openMinigamesExtra(); });
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
  on($('startBtn'), 'click', begin);
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
