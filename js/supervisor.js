/* TEST SUBJECT — Modo Supervisor (FNAF-lite) */
(function (g) {
  const LOCS = ['oficina', 'archivo', 'sala12', 'continuidad', 'terminal', 'pasillo'];
  const LOC_LABEL = {
    oficina: 'OFICINA',
    archivo: 'ARCHIVO',
    sala12: 'SALA 12',
    continuidad: 'CONTINUIDAD',
    terminal: 'TERMINAL',
    pasillo: 'PASILLO'
  };

  // Patrones base por unidad (AI level escala con sesión y tiempo)
  const PATTERNS = {
    u01: { name: 'UNIDAD 01', path: ['archivo', 'terminal', 'pasillo', 'oficina'], speed: 1.0, camVisible: 1 },
    u02: { name: 'UNIDAD 02', path: ['pasillo', 'archivo', 'pasillo', 'oficina'], speed: 1.15, camVisible: 0.7, watchBoost: true },
    u03: { name: 'UNIDAD 03', path: ['sala12', 'continuidad', 'sala12', 'oficina'], speed: 1.1, camVisible: 0.85, teleport: true },
    u04: { name: 'UNIDAD 04', path: ['terminal', 'archivo', 'pasillo', 'oficina'], speed: 1.0, camVisible: 1 },
    u05: { name: 'UNIDAD 05', path: ['continuidad', 'pasillo', 'oficina'], speed: 1.25, camVisible: 0.35 }
  };

  const BRIEF = {
    1: 'Sesión 1. Solo la Unidad 01. Avanza por Archivo → Terminal → Pasillo. Es predecible pero constante. Cierra la puerta cuando esté en Pasillo. Revisa cámaras. 6 minutos.',
    2: 'Sesión 2. Se suma la Unidad 02. Aparece más si la miras demasiado en cámara. No fijes la vista en ella. Sigue vigilando a la 01.',
    3: 'Sesión 3. Unidad 03 entra en juego. Salta entre Sala 12 y Continuidad. A veces cambia de sitio sin pasar por el pasillo. No confíes solo en el orden.',
    4: 'Sesión 4. Unidad 04 también camina. Cuatro rutas. Prioriza quien esté en Pasillo. El tiempo las pone más agresivas a todas.',
    5: 'Sesión 5. Las cinco. La Unidad 05 casi no sale en cámara. Si el pasillo está vacío y oyes algo… ya es tarde. Aguanta 6 minutos.'
  };

  function createState(session) {
    const activeIds = [];
    for (let i = 1; i <= session; i++) activeIds.push('u0' + i);
    const units = {};
    activeIds.forEach(id => {
      const p = PATTERNS[id];
      units[id] = {
        id,
        name: p.name,
        path: p.path.slice(),
        idx: 0,
        loc: p.path[0],
        timer: 0,
        baseInterval: 9000 / p.speed,
        camVisible: p.camVisible,
        teleport: !!p.teleport,
        watchBoost: !!p.watchBoost
      };
    });
    return {
      session,
      timeLeft: 360, // 6 min
      power: 100,
      doorClosed: false,
      cam: 'archivo',
      camOpen: false,
      units,
      dead: false,
      won: false,
      aggression: 1
    };
  }

  function tick(state, dt, watchingCam) {
    if (state.dead || state.won) return state;
    state.timeLeft -= dt;
    // Agresividad: sube con el tiempo y con el número de sesión
    const timeFactor = 1 + (1 - state.timeLeft / 360) * 1.4;
    state.aggression = (0.75 + state.session * 0.2) * timeFactor;

    if (state.doorClosed) state.power -= dt * 0.55;
    if (state.camOpen) state.power -= dt * 0.25;
    if (state.power <= 0) {
      state.power = 0;
      state.doorClosed = false;
      state.camOpen = false;
    }

    Object.keys(state.units).forEach(id => {
      const u = state.units[id];
      const pat = PATTERNS[id];
      let interval = u.baseInterval / state.aggression;
      if (u.watchBoost && watchingCam && state.cam === u.loc) interval *= 0.65;
      u.timer += dt * 1000;
      if (u.timer >= interval) {
        u.timer = 0;
        if (u.teleport && Math.random() < 0.25) {
          u.idx = Math.floor(Math.random() * Math.max(1, u.path.length - 1));
          u.loc = u.path[u.idx];
        } else {
          u.idx = Math.min(u.idx + 1, u.path.length - 1);
          u.loc = u.path[u.idx];
        }
        // Si llega a oficina y puerta abierta → muerte
        if (u.loc === 'oficina') {
          if (!state.doorClosed) {
            state.dead = true;
            state.killedBy = u.name;
          } else {
            // Rechazada: vuelve al inicio del path
            u.idx = 0;
            u.loc = u.path[0];
          }
        }
      }
    });

    if (state.timeLeft <= 0 && !state.dead) {
      state.timeLeft = 0;
      state.won = true;
    }
    return state;
  }

  function unitsAt(state, loc) {
    return Object.values(state.units).filter(u => u.loc === loc);
  }

  function camView(state) {
    const here = unitsAt(state, state.cam);
    const visible = here.filter(u => Math.random() < (PATTERNS[u.id].camVisible || 1));
    // U05 often invisible
    return {
      loc: state.cam,
      label: LOC_LABEL[state.cam] || state.cam,
      units: visible.map(u => u.name),
      hint: here.length && !visible.length ? 'Señal inestable…' : null
    };
  }

  g.TSSupervisor = {
    LOCS, LOC_LABEL, PATTERNS, BRIEF, createState, tick, unitsAt, camView
  };
})(typeof window !== 'undefined' ? window : global);
