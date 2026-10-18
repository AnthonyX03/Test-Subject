/* TEST SUBJECT — Supervisor (mapa ampliado, 2 puertas) */
(function (g) {
  const NODES = {
    archivo:     { x: 18, y: 12, label: 'ARCHIVO' },
    continuidad: { x: 42, y: 8,  label: 'CONTINUIDAD' },
    sala12:      { x: 68, y: 12, label: 'SALA 12' },
    lab:         { x: 88, y: 18, label: 'LAB' },
    terminal:    { x: 14, y: 38, label: 'TERMINAL' },
    hub:         { x: 42, y: 36, label: 'NÚCLEO' },
    pasillo:     { x: 70, y: 38, label: 'PASILLO' },
    almacen:     { x: 90, y: 42, label: 'ALMACÉN' },
    puertaA:     { x: 28, y: 62, label: 'PUERTA A' },
    puertaB:     { x: 72, y: 62, label: 'PUERTA B' },
    oficina:     { x: 50, y: 88, label: 'TÚ' }
  };

  const EDGES = [
    ['archivo', 'continuidad'], ['continuidad', 'sala12'], ['sala12', 'lab'],
    ['archivo', 'terminal'], ['continuidad', 'hub'], ['sala12', 'pasillo'], ['lab', 'almacen'],
    ['terminal', 'hub'], ['hub', 'pasillo'], ['pasillo', 'almacen'],
    ['terminal', 'puertaA'], ['hub', 'puertaA'], ['hub', 'puertaB'], ['pasillo', 'puertaB'], ['almacen', 'puertaB'],
    ['puertaA', 'oficina'], ['puertaB', 'oficina']
  ];

  const UNIT_FACE = {
    u01: { eyes: '· ·', mouth: '─', color: '#4db8ff' },
    u02: { eyes: '• •', mouth: '‿', color: '#ff6a90' },
    u03: { eyes: '◦ ◦', mouth: '﹀', color: '#e8c44a' },
    u04: { eyes: '• •', mouth: '﹀', color: '#5dff88' },
    u05: { eyes: '· ·', mouth: ' ', color: '#c8c8c8' }
  };

  // Paths end at a door then oficina
  const PATTERNS = {
    u01: { name: 'U01', path: ['archivo', 'terminal', 'puertaA', 'oficina'], speed: 1.0 },
    u02: { name: 'U02', path: ['pasillo', 'hub', 'puertaB', 'oficina'], speed: 1.15, watchBoost: true },
    u03: { name: 'U03', path: ['sala12', 'lab', 'almacen', 'puertaB', 'oficina'], speed: 1.05, teleport: true },
    u04: { name: 'U04', path: ['terminal', 'hub', 'puertaA', 'oficina'], speed: 1.0 },
    u05: { name: 'U05', path: ['continuidad', 'pasillo', 'puertaB', 'oficina'], speed: 1.25 }
  };

  // Sin spoilers de mal rollo
  const BRIEF_INTRO = [
    'Soy el Supervisor. Vigilo este terminal mientras tú ocupas la oficina.',
    'Las Unidades se mueven por el mapa. Tu trabajo es no dejar que entren.',
    'Hay dos puertas: A y B. Puedes cerrar una o las dos. Cada cierre gasta energía.',
    'Si una Unidad llega a ti con la puerta abierta… el expediente te marca como recuperado.'
  ];

  const BRIEF_SESSION = {
    1: 'Sesión 1 — Solo la Unidad 01. Suele venir por Archivo y Terminal hacia la Puerta A.',
    2: 'Sesión 2 — Entra la 02. Prefiere el Pasillo y la Puerta B. No la mires demasiado.',
    3: 'Sesión 3 — La 03 salta entre Sala 12 y el Lab. No confíes solo en una ruta.',
    4: 'Sesión 4 — La 04 también camina. Prioriza quien esté en una puerta.',
    5: 'Sesión 5 — Las cinco. La 05 casi no se ve. Si el pasillo parece vacío… presta atención.'
  };

  const LINES = {
    calm: {
      near: [
        'Movimiento cerca de una puerta.',
        'Alguien en el pasillo.',
        'Revisa Puerta A y Puerta B.',
        'Energía finita. No dejes ambas cerradas de más.',
        'Núcleo ocupado.'
      ],
      idle: [
        'Canal estable.',
        'Sigo aquí abajo.',
        'Puedes escribirme.',
        'El mapa no miente.',
        'Seis minutos. Cuenta conmigo.'
      ],
      reply: [
        'Registrado.',
        'Concéntrate en las puertas.',
        'Si lo oyes, ya está cerca.',
        'Sigue mirando el mapa.',
        'Anotado.'
      ]
    },
    horror: {
      near: [
        'Está más cerca de lo que ves.',
        'Una puerta no siempre basta.',
        '¿Seguro que el mapa muestra la verdad?',
        'Alguien ya pasó el núcleo.'
      ],
      idle: [
        'El canal se ensucia.',
        '¿Quién supervisa al Supervisor?',
        'Ellas no preguntan. Recuperan.'
      ],
      reply: [
        '…',
        'No debería responder a eso.',
        'Cierra las puertas. O no.',
        'Sigue escribiendo. No cambia el timer.'
      ]
    }
  };

  function createState(session) {
    const activeIds = [];
    for (let i = 1; i <= session; i++) activeIds.push('u0' + i);
    const units = {};
    activeIds.forEach(id => {
      const p = PATTERNS[id];
      const start = p.path[0];
      const node = NODES[start];
      units[id] = {
        id, name: p.name, path: p.path.slice(), idx: 0, loc: start,
        x: node.x, y: node.y, tx: node.x, ty: node.y,
        timer: 0, baseInterval: 8500 / p.speed,
        face: UNIT_FACE[id], teleport: !!p.teleport, watchBoost: !!p.watchBoost
      };
    });
    return {
      session, timeLeft: 360, power: 100,
      doorA: false, doorB: false,
      cam: 'hub', camOpen: false,
      units, dead: false, won: false, aggression: 1, horror: false, killedBy: null
    };
  }

  function tick(state, dt) {
    if (state.dead || state.won) return state;
    state.timeLeft -= dt;
    const timeFactor = 1 + (1 - state.timeLeft / 360) * 1.4;
    state.aggression = (0.7 + state.session * 0.2) * timeFactor;
    state.horror = state.timeLeft <= 180;

    let drain = 0;
    if (state.doorA) drain += 0.32;
    if (state.doorB) drain += 0.32;
    state.power -= dt * drain;
    if (state.power <= 0) {
      state.power = 0;
      state.doorA = false;
      state.doorB = false;
    }

    Object.keys(state.units).forEach(id => {
      const u = state.units[id];
      let interval = u.baseInterval / state.aggression;
      u.timer += dt * 1000;
      u.x += (u.tx - u.x) * Math.min(1, dt * 2.5);
      u.y += (u.ty - u.y) * Math.min(1, dt * 2.5);

      if (u.timer >= interval) {
        u.timer = 0;
        if (u.teleport && Math.random() < 0.25) {
          u.idx = Math.floor(Math.random() * Math.max(1, u.path.length - 1));
        } else {
          u.idx = Math.min(u.idx + 1, u.path.length - 1);
        }
        u.loc = u.path[u.idx];
        const node = NODES[u.loc];
        if (u.teleport && Math.random() < 0.35) { u.x = node.x; u.y = node.y; }
        u.tx = node.x; u.ty = node.y;

        if (u.loc === 'oficina') {
          // ¿entró por A o B? mirar paso anterior
          const prev = u.path[Math.max(0, u.idx - 1)];
          const blocked = (prev === 'puertaA' && state.doorA) || (prev === 'puertaB' && state.doorB);
          // si está en oficina sin paso claro, ambas puertas importan
          const anyOpen = !state.doorA || !state.doorB;
          if (blocked || (prev !== 'puertaA' && prev !== 'puertaB' && state.doorA && state.doorB)) {
            // rebotar
            u.idx = 0;
            u.loc = u.path[0];
            const n0 = NODES[u.loc];
            u.tx = n0.x; u.ty = n0.y;
          } else if ((prev === 'puertaA' && !state.doorA) || (prev === 'puertaB' && !state.doorB) || (!state.doorA && !state.doorB)) {
            state.dead = true;
            state.killedBy = u.name;
          } else {
            u.idx = 0;
            u.loc = u.path[0];
            const n0 = NODES[u.loc];
            u.tx = n0.x; u.ty = n0.y;
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

  function anyoneNearDoor(state) {
    return Object.values(state.units).some(u =>
      u.loc === 'puertaA' || u.loc === 'puertaB' || u.loc === 'pasillo' || u.loc === 'hub' || u.loc === 'terminal'
    );
  }

  function pickLine(state, kind) {
    const bag = LINES[state.horror ? 'horror' : 'calm'][kind] || LINES.calm.idle;
    return bag[Math.floor(Math.random() * bag.length)];
  }

  g.TSSupervisor = {
    NODES, EDGES, UNIT_FACE, PATTERNS, BRIEF_INTRO, BRIEF_SESSION,
    createState, tick, anyoneNearDoor, pickLine, LINES
  };
})(typeof window !== 'undefined' ? window : global);
