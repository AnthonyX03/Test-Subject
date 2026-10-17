/* TEST SUBJECT — Cartas de Contingencia (200+) */
(function (g) {
  const TYPES = {
    strike:   { kind: 'atk',  icon: '◆', label: 'GOLPE' },
    pierce:   { kind: 'atk',  icon: '◇', label: 'PERFORAR' },
    barrage:  { kind: 'atk',  icon: '▣', label: 'RÁFAGA' },
    guard:    { kind: 'def',  icon: '▣', label: 'GUARDA' },
    barrier:  { kind: 'def',  icon: '⬡', label: 'BARRERA' },
    recover:  { kind: 'heal', icon: '✚', label: 'REPARAR' },
    drain:    { kind: 'atk',  icon: '◎', label: 'DRENAR' },
    glitch:   { kind: 'deb',  icon: '⌁', label: 'GLITCH' },
    protocol: { kind: 'buff', icon: '◈', label: 'PROTOCOLO' },
    scan:     { kind: 'util', icon: '◉', label: 'ESCANEO' },
    silence:  { kind: 'deb',  icon: '∅', label: 'SILENCIO' },
    mirror:   { kind: 'def',  icon: '⬢', label: 'ESPEJO' }
  };

  const PREFIXES = [
    'Archivo','Sala 12','Núcleo','Pasillo','Terminal','Continuidad','Operador',
    'Sujeto','Protocolo','Señal','Eco','Velo','Fragmento','Registro','Anomalía',
    'Cierre','Umbral','Espejo','Ruido','Latencia','Checksum','Nodo','Vector',
    'Cáscara','Residuo','Sombra','Vigilante','Expediente','Clave','Puerto'
  ];
  const SUFFIXES = [
    'Alpha','Beta','Gamma','Delta','Épsilon','Zeta','Theta','Lambda','Sigma','Omega',
    '01','07','09','12','18','22','27','33','41','48','55','60','66','72','81','90',
    'Rojo','Verde','Ámbar','Violeta','Cian','Nulo','Frio','Cálido','Roto','Sello'
  ];
  const FLAVORS = [
    'El archivo no olvida.','Firmado en tinta que no debería existir.','Latencia controlada.',
    'Eco de una entrevista anterior.','No mirar el reverso.','Aprobado sin revisión.',
    'Solo para operadores.','Clasificación: residual.','Copia no autorizada.',
    'La unidad lo reconoce.','Falla a propósito.','Mantiene la puerta cerrada.',
    'Rompe el patrón.','Extrae señal del ruido.','Cierra el bucle.'
  ];

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function buildCard(id, typeKey, power, cost, rarity, name, text) {
    const t = TYPES[typeKey];
    return {
      id, type: typeKey, kind: t.kind, icon: t.icon, label: t.label,
      power, cost, rarity, name, text,
      // effects resolved in combat
      dmg: t.kind === 'atk' ? power : 0,
      shield: t.kind === 'def' ? power : 0,
      heal: t.kind === 'heal' ? power : 0,
      drain: typeKey === 'drain' ? Math.max(1, Math.floor(power * 0.6)) : 0,
      debuff: (typeKey === 'glitch' || typeKey === 'silence') ? power : 0,
      buff: typeKey === 'protocol' ? power : 0,
      util: typeKey === 'scan' ? 1 : 0,
      mirror: typeKey === 'mirror' ? 1 : 0
    };
  }

  const CARDS = [];
  const typeKeys = Object.keys(TYPES);
  const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic'];

  // 200+ unique combinatorial cards
  let n = 0;
  for (let i = 0; i < PREFIXES.length; i++) {
    for (let j = 0; j < Math.min(7, SUFFIXES.length); j++) {
      const typeKey = typeKeys[(i * 3 + j) % typeKeys.length];
      const h = hash(PREFIXES[i] + SUFFIXES[j] + typeKey);
      const power = 2 + (h % 7); // 2-8
      const cost = 1 + (h % 3);  // 1-3
      const rarity = rarities[h % rarities.length];
      const name = PREFIXES[i] + ' ' + SUFFIXES[j];
      const text = FLAVORS[h % FLAVORS.length];
      const id = 'c' + String(++n).padStart(3, '0');
      CARDS.push(buildCard(id, typeKey, power, cost, rarity, name, text));
      if (n >= 210) break;
    }
    if (n >= 210) break;
  }

  // Starter set always available
  const STARTER_IDS = CARDS.filter(c => c.rarity === 'common').slice(0, 12).map(c => c.id);

  const PACKS = [
    { id: 'pack_basic', name: 'Sobre residual', price: 18, count: 3, weights: { common: 70, uncommon: 25, rare: 5, epic: 0 } },
    { id: 'pack_ops', name: 'Sobre de operador', price: 35, count: 5, weights: { common: 45, uncommon: 35, rare: 15, epic: 5 } },
    { id: 'pack_core', name: 'Sobre del núcleo', price: 60, count: 5, weights: { common: 25, uncommon: 35, rare: 30, epic: 10 } }
  ];

  function getCard(id) { return CARDS.find(c => c.id === id) || null; }

  function openPack(packId) {
    const pack = PACKS.find(p => p.id === packId);
    if (!pack) return [];
    const poolByR = {};
    CARDS.forEach(c => {
      poolByR[c.rarity] = poolByR[c.rarity] || [];
      poolByR[c.rarity].push(c);
    });
    const out = [];
    for (let i = 0; i < pack.count; i++) {
      const r = rollRarity(pack.weights);
      const pool = poolByR[r] && poolByR[r].length ? poolByR[r] : CARDS;
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return out;
  }

  function rollRarity(w) {
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k of Object.keys(w)) {
      r -= w[k];
      if (r <= 0) return k;
    }
    return 'common';
  }

  g.TSCards = {
    CARDS, STARTER_IDS, PACKS, TYPES,
    getCard, openPack,
    count: CARDS.length
  };
})(typeof window !== 'undefined' ? window : global);
