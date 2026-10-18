/* TEST SUBJECT — Supervisor v9.7 (mapas, ocultación, reparación) */
(function (g) {
  const NODES_MAIN = {
    archivo:     { x: 16, y: 12, label: 'ARCHIVO' },
    continuidad: { x: 40, y: 8,  label: 'CONTINUIDAD' },
    sala12:      { x: 64, y: 12, label: 'SALA 12' },
    lab:         { x: 86, y: 16, label: 'LAB' },
    terminal:    { x: 14, y: 36, label: 'TERMINAL' },
    hub:         { x: 40, y: 34, label: 'NÚCLEO' },
    pasillo:     { x: 66, y: 36, label: 'PASILLO' },
    almacen:     { x: 88, y: 40, label: 'ALMACÉN' },
    puertaA:     { x: 26, y: 60, label: 'PUERTA A' },
    puertaB:     { x: 70, y: 60, label: 'PUERTA B' },
    oficina:     { x: 48, y: 86, label: 'TÚ' }
  };
  const EDGES_MAIN = [
    ['archivo','continuidad'],['continuidad','sala12'],['sala12','lab'],
    ['archivo','terminal'],['continuidad','hub'],['sala12','pasillo'],['lab','almacen'],
    ['terminal','hub'],['hub','pasillo'],['pasillo','almacen'],
    ['terminal','puertaA'],['hub','puertaA'],['hub','puertaB'],['pasillo','puertaB'],['almacen','puertaB'],
    ['puertaA','oficina'],['puertaB','oficina']
  ];

  // Conductos: más simple, una puerta
  const NODES_VENT = {
    v1: { x: 20, y: 18, label: 'C-1' },
    v2: { x: 50, y: 14, label: 'C-2' },
    v3: { x: 80, y: 18, label: 'C-3' },
    v4: { x: 35, y: 42, label: 'C-4' },
    v5: { x: 65, y: 42, label: 'C-5' },
    puertaC: { x: 50, y: 64, label: 'CONDUCTO' },
    oficina: { x: 50, y: 88, label: 'TÚ' }
  };
  const EDGES_VENT = [
    ['v1','v2'],['v2','v3'],['v1','v4'],['v3','v5'],['v4','v5'],
    ['v4','puertaC'],['v5','puertaC'],['puertaC','oficina']
  ];

  const UNIT_FACE = {
    u01: { eyes: '· ·', mouth: '─', color: '#4db8ff' },
    u02: { eyes: '• •', mouth: '‿', color: '#ff6a90' },
    u03: { eyes: '◦ ◦', mouth: '﹀', color: '#e8c44a' },
    u04: { eyes: '• •', mouth: '﹀', color: '#5dff88' },
    u05: { eyes: '· ·', mouth: ' ', color: '#c8c8c8' }
  };

  const PATTERNS = {
    u01: { name: 'U01', path: ['archivo','terminal','puertaA','oficina'], ventPath: ['v1','v4','puertaC','oficina'], speed: 1.0 },
    u02: { name: 'U02', path: ['pasillo','hub','puertaB','oficina'], ventPath: ['v3','v5','puertaC','oficina'], speed: 1.12 },
    u03: { name: 'U03', path: ['sala12','lab','almacen','puertaB','oficina'], ventPath: ['v2','v5','puertaC','oficina'], speed: 1.05, teleport: true },
    u04: { name: 'U04', path: ['terminal','hub','puertaA','oficina'], ventPath: ['v1','v2','v4','puertaC','oficina'], speed: 1.0 },
    u05: { name: 'U05', path: ['continuidad','pasillo','puertaB','oficina'], ventPath: ['v2','v3','puertaC','oficina'], speed: 1.22 }
  };

  const BRIEF_INTRO = [
    'Soy el Supervisor. Vigilo este terminal mientras tú ocupas la oficina.',
    'Las Unidades se mueven por el mapa principal y, a veces, por los conductos.',
    'Tienes Puerta A, Puerta B y el Conducto. Ciérralos con cuidado: gastan energía.',
    'Puedes escanear zonas, mirar cámaras o cambiar al mapa de conductos. Si algo se estropea… repáralo.'
  ];
  const BRIEF_SESSION = {
    1: 'Sesión 1 — Unidad 01. Suele usar Archivo → Terminal → Puerta A. También puede meterse en conductos.',
    2: 'Sesión 2 — Entra la 02. Prefiere Pasillo y Puerta B.',
    3: 'Sesión 3 — La 03 salta. No confíes solo en una ruta.',
    4: 'Sesión 4 — Cuatro Unidades. Prioriza puertas con movimiento.',
    5: 'Sesión 5 — Las cinco. La 05 se esconde con facilidad.'
  };

  const LINES = {
    calm: {
      near: ['Movimiento cerca de una puerta.','Alguien en el pasillo.','Revisa A y B.','Conducto activo.','Núcleo ocupado.'],
      idle: ['Canal estable.','Sigo aquí.','Puedes escanear.','El mapa no lo muestra todo.','Seis minutos.'],
      reply: ['Registrado.','Concéntrate en las puertas.','Prueba cámaras si no la ves.','Anotado.']
    },
    horror: {
      near: ['Más cerca de lo que ves.','Una puerta no siempre basta.','¿El mapa miente?'],
      idle: ['El canal se ensucia.','¿Quién vigila a quién?'],
      reply: ['…','No debería responder.','Repara lo que puedas.']
    }
  };

  function createState(session) {
    const units = {};
    for (let i = 1; i <= session; i++) {
      const id = 'u0' + i;
      const p = PATTERNS[id];
      const start = p.path[0];
      const node = NODES_MAIN[start];
      units[id] = {
        id, name: p.name,
        path: p.path.slice(), ventPath: p.ventPath.slice(),
        idx: 0, loc: start, layer: 'main',
        x: node.x, y: node.y, tx: node.x, ty: node.y,
        timer: 0, baseInterval: 9000 / p.speed,
        face: UNIT_FACE[id], teleport: !!p.teleport,
        hidden: false, hideTimer: 0
      };
    }
    return {
      session, timeLeft: 360, power: 100,
      doorA: false, doorB: false, doorC: false,
      doorABroken: false, doorBBroken: false, doorCBroken: false,
      powerBroken: false,
      mapLayer: 'main', scanning: false,
      mode: 'none', // none | scan | cam
      camRoom: null,
      scanRoom: null, scanTimer: 0,
      units, dead: false, won: false, aggression: 1, horror: false, killedBy: null,
      failTimer: 0
    };
  }

  function nodesFor(state) {
    return state.mapLayer === 'vent' ? NODES_VENT : NODES_MAIN;
  }
  function edgesFor(state) {
    return state.mapLayer === 'vent' ? EDGES_VENT : EDGES_MAIN;
  }

  function tick(state, dt) {
    if (state.dead || state.won) return state;
    state.timeLeft -= dt;
    state.aggression = (0.7 + state.session * 0.2) * (1 + (1 - state.timeLeft / 360) * 1.3);
    state.horror = state.timeLeft <= 180;
    if (state.scanTimer > 0) state.scanTimer -= dt;

    // fallos aleatorios
    state.failTimer += dt;
    if (state.failTimer > 25) {
      state.failTimer = 0;
      if (Math.random() < 0.22) {
        const r = Math.random();
        if (r < 0.28) state.doorABroken = true;
        else if (r < 0.5) state.doorBBroken = true;
        else if (r < 0.68) state.doorCBroken = true;
        else if (r < 0.85) state.powerBroken = true;
      }
    }

    let drain = 0;
    if (state.doorA) drain += 0.28;
    if (state.doorB) drain += 0.28;
    if (state.doorC) drain += 0.3;
    if (!state.powerBroken) state.power -= dt * drain;
    if (state.power <= 0) {
      state.power = 0;
      state.doorA = state.doorB = state.doorC = false;
    }

    Object.keys(state.units).forEach(id => {
      const u = state.units[id];
      // ocultación
      u.hideTimer += dt;
      if (u.hideTimer > 12 + Math.random() * 10) {
        u.hideTimer = 0;
        if (Math.random() < 0.35) u.hidden = !u.hidden;
      }

      // cambio de capa ocasional
      if (Math.random() < 0.002 * state.aggression) {
        u.layer = u.layer === 'main' ? 'vent' : 'main';
        u.idx = 0;
        const path = u.layer === 'vent' ? u.ventPath : u.path;
        u.loc = path[0];
        const nodes = u.layer === 'vent' ? NODES_VENT : NODES_MAIN;
        const n = nodes[u.loc];
        u.x = u.tx = n.x; u.y = u.ty = n.y;
      }

      const path = u.layer === 'vent' ? u.ventPath : u.path;
      const nodes = u.layer === 'vent' ? NODES_VENT : NODES_MAIN;
      let interval = u.baseInterval / state.aggression;
      u.timer += dt * 1000;
      u.x += (u.tx - u.x) * Math.min(1, dt * 2.4);
      u.y += (u.ty - u.y) * Math.min(1, dt * 2.4);

      if (u.timer >= interval) {
        u.timer = 0;
        if (u.teleport && Math.random() < 0.22) {
          u.idx = Math.floor(Math.random() * Math.max(1, path.length - 1));
        } else {
          u.idx = Math.min(u.idx + 1, path.length - 1);
        }
        u.loc = path[u.idx];
        const node = nodes[u.loc];
        if (node) {
          if (u.teleport && Math.random() < 0.3) { u.x = node.x; u.y = node.y; }
          u.tx = node.x; u.ty = node.y;
        }

        if (u.loc === 'oficina') {
          const prev = path[Math.max(0, u.idx - 1)];
          let blocked = false;
          if (prev === 'puertaA') blocked = state.doorA;
          else if (prev === 'puertaB') blocked = state.doorB;
          else if (prev === 'puertaC') blocked = state.doorC;
          else blocked = state.doorA && state.doorB && state.doorC;
          if (blocked) {
            u.idx = 0; u.loc = path[0];
            const n0 = nodes[u.loc];
            if (n0) { u.tx = n0.x; u.ty = n0.y; }
          } else {
            state.dead = true;
            state.killedBy = u.name;
          }
        }
      }
    });

    if (state.timeLeft <= 0 && !state.dead) { state.timeLeft = 0; state.won = true; }
    return state;
  }

  function anyoneNearDoor(state) {
    return Object.values(state.units).some(u =>
      /puerta|pasillo|hub|terminal|v4|v5/.test(u.loc)
    );
  }
  function pickLine(state, kind) {
    const bag = LINES[state.horror ? 'horror' : 'calm'][kind] || LINES.calm.idle;
    return bag[Math.floor(Math.random() * bag.length)];
  }
  function repair(state, what) {
    if (what === 'doorA') state.doorABroken = false;
    if (what === 'doorB') state.doorBBroken = false;
    if (what === 'doorC') state.doorCBroken = false;
    if (what === 'power') state.powerBroken = false;
  }

  g.TSSupervisor = {
    NODES: NODES_MAIN, EDGES: EDGES_MAIN,
    NODES_MAIN, EDGES_MAIN, NODES_VENT, EDGES_VENT,
    UNIT_FACE, PATTERNS, BRIEF_INTRO, BRIEF_SESSION,
    createState, tick, anyoneNearDoor, pickLine, repair, nodesFor, edgesFor, LINES
  };
})(typeof window !== 'undefined' ? window : global);
