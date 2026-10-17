/* TEST SUBJECT — Modo Supervisor (mapa visual + IA) */
(function (g) {
  // Nodos del mapa (coordenadas % sobre el área del mapa)
  const NODES = {
    archivo:     { x: 20, y: 16, label: 'ARCHIVO' },
    continuidad: { x: 50, y: 10, label: 'CONTINUIDAD' },
    sala12:      { x: 80, y: 16, label: 'SALA 12' },
    terminal:    { x: 18, y: 42, label: 'TERMINAL' },
    hub:         { x: 50, y: 40, label: 'NÚCLEO' },
    pasillo:     { x: 82, y: 42, label: 'PASILLO' },
    puerta:      { x: 50, y: 68, label: 'PUERTA' },
    oficina:     { x: 50, y: 88, label: 'TÚ' }
  };

  // Conexiones visuales (líneas)
  const EDGES = [
    ['archivo', 'continuidad'], ['continuidad', 'sala12'],
    ['archivo', 'terminal'], ['sala12', 'pasillo'],
    ['terminal', 'hub'], ['hub', 'pasillo'],
    ['hub', 'puerta'], ['terminal', 'puerta'], ['pasillo', 'puerta'],
    ['puerta', 'oficina']
  ];

  const UNIT_FACE = {
    u01: { eyes: '· ·', mouth: '─', color: '#4db8ff' },
    u02: { eyes: '• •', mouth: '‿', color: '#ff6a90' },
    u03: { eyes: '◦ ◦', mouth: '﹀', color: '#e8c44a' },
    u04: { eyes: '• •', mouth: '﹀', color: '#5dff88' },
    u05: { eyes: '· ·', mouth: ' ', color: '#c8c8c8' }
  };

  const PATTERNS = {
    u01: { name: 'U01', path: ['archivo', 'terminal', 'hub', 'puerta', 'oficina'], speed: 1.0, camVisible: 1 },
    u02: { name: 'U02', path: ['pasillo', 'hub', 'puerta', 'oficina'], speed: 1.2, camVisible: 0.75, watchBoost: true },
    u03: { name: 'U03', path: ['sala12', 'continuidad', 'hub', 'puerta', 'oficina'], speed: 1.05, camVisible: 0.85, teleport: true },
    u04: { name: 'U04', path: ['terminal', 'archivo', 'hub', 'puerta', 'oficina'], speed: 1.0, camVisible: 1 },
    u05: { name: 'U05', path: ['continuidad', 'pasillo', 'puerta', 'oficina'], speed: 1.3, camVisible: 0.3 }
  };

  const BRIEF_INTRO = [
    'Soy el Supervisor. No soy una de las cinco unidades de entrevista… aunque el archivo a veces me clasifica como tal.',
    'Tu trabajo: no dejar que te recuperen. Ellas se mueven por el mapa. Tú controlas la puerta y las cámaras.',
    'Si una unidad llega a la OFICINA con la puerta abierta, el expediente te marca como recuperado.',
    'Puedes hablarme abajo. A veces aviso. A veces no. A los tres minutos el canal se ensucia… y yo también.'
  ];

  const BRIEF_SESSION = {
    1: 'Sesión 1 — Solo la Unidad 01. Ruta fija: Archivo → Terminal → Núcleo → Puerta. Predecible. Cierra cuando esté en Puerta.',
    2: 'Sesión 2 — Entra la 02. Si la miras demasiado en cámara, acelera. No fijes la vista.',
    3: 'Sesión 3 — La 03 salta entre Sala 12 y Continuidad. No confíes solo en el orden del pasillo.',
    4: 'Sesión 4 — La 04 también camina. Prioriza quien esté en Puerta. El tiempo las pone peores a todas.',
    5: 'Sesión 5 — Las cinco. La 05 casi no sale en cámara. Si el pasillo parece vacío y oyes algo… ya es tarde.'
  };

  // Frases del Supervisor (fase calm / horror)
  const LINES = {
    calm: {
      near: [
        'Movimiento cerca de la puerta.',
        'Alguien en el pasillo. Revisa.',
        'No mires solo una cámara.',
        'Energía finita. No dejes la puerta cerrada de más.',
        'Núcleo ocupado. Ojo.'
      ],
      idle: [
        'Canal estable… de momento.',
        'Sigo aquí abajo.',
        'Puedes escribirme. No prometo respuestas útiles.',
        'El mapa no miente. Las unidades a veces sí.',
        'Seis minutos. Cuenta hacia atrás conmigo.'
      ],
      reply: [
        'Registrado.',
        'No estoy autorizado a confirmar eso.',
        'Concéntrate en la puerta.',
        'Si lo oyes, ya está cerca.',
        'Sigue mirando el mapa.',
        'Eso no cambia la ruta de la 01.'
      ]
    },
    horror: {
      near: [
        'Está más cerca de lo que ves.',
        'La puerta no bastará siempre.',
        '¿Seguro que la cámara muestra la verdad?',
        'Alguien ya pasó el núcleo.',
        'No mires atrás. Mira el mapa.'
      ],
      idle: [
        'El canal se ensucia.',
        'Ya no es solo vigilancia.',
        '¿Quién supervisa al Supervisor?',
        'Tres minutos bastaron para cambiar el tono.',
        'Ellas no preguntan. Recuperan.'
      ],
      reply: [
        '…',
        'No debería responder a eso.',
        'El archivo ya te tiene.',
        'Sigue escribiendo. No cambia el timer.',
        'A veces ayudo. Ahora no estoy seguro.',
        'Cierra la puerta. O no. Tú decides.'
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
        id,
        name: p.name,
        path: p.path.slice(),
        idx: 0,
        loc: start,
        x: node.x,
        y: node.y,
        tx: node.x,
        ty: node.y,
        timer: 0,
        baseInterval: 8000 / p.speed,
        face: UNIT_FACE[id],
        teleport: !!p.teleport,
        watchBoost: !!p.watchBoost
      };
    });
    return {
      session,
      timeLeft: 360,
      power: 100,
      doorClosed: false,
      cam: 'hub',
      camOpen: false,
      units,
      dead: false,
      won: false,
      aggression: 1,
      horror: false,
      killedBy: null
    };
  }

  function tick(state, dt, watchingCam) {
    if (state.dead || state.won) return state;
    state.timeLeft -= dt;
    const timeFactor = 1 + (1 - state.timeLeft / 360) * 1.5;
    state.aggression = (0.7 + state.session * 0.22) * timeFactor;
    state.horror = state.timeLeft <= 180;

    if (state.doorClosed) state.power -= dt * 0.48;
    if (state.power <= 0) {
      state.power = 0;
      state.doorClosed = false;
      state.camOpen = false;
    }

    Object.keys(state.units).forEach(id => {
      const u = state.units[id];
      const pat = PATTERNS[id];
      let interval = u.baseInterval / state.aggression;
      if (u.watchBoost && watchingCam && state.cam === u.loc) interval *= 0.6;
      u.timer += dt * 1000;

      // Suavizar movimiento hacia target
      u.x += (u.tx - u.x) * Math.min(1, dt * 2.5);
      u.y += (u.ty - u.y) * Math.min(1, dt * 2.5);

      if (u.timer >= interval) {
        u.timer = 0;
        if (u.teleport && Math.random() < 0.28) {
          u.idx = Math.floor(Math.random() * Math.max(1, u.path.length - 1));
        } else {
          u.idx = Math.min(u.idx + 1, u.path.length - 1);
        }
        u.loc = u.path[u.idx];
        const node = NODES[u.loc];
        if (u.teleport && Math.random() < 0.4) {
          u.x = node.x; u.y = node.y;
        }
        u.tx = node.x; u.ty = node.y;

        if (u.loc === 'oficina') {
          if (!state.doorClosed) {
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
    return Object.values(state.units).some(u => u.loc === 'puerta' || u.loc === 'pasillo' || u.loc === 'hub');
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
