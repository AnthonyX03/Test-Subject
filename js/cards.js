/* TEST SUBJECT — Mini-unidades de Contingencia (200+) */
(function (g) {
  // Roles de tropa (qué hace la mini-unidad)
  const ROLES = {
    striker:  { kind: 'atk',  label: 'ASALTO',   verb: 'ataca' },
    piercer:  { kind: 'atk',  label: 'PERFORA',  verb: 'perfora' },
    gunner:   { kind: 'atk',  label: 'RÁFAGA',   verb: 'abre fuego' },
    guard:    { kind: 'def',  label: 'GUARDA',   verb: 'protege' },
    shield:   { kind: 'def',  label: 'BARRERA',  verb: 'levanta escudo' },
    medic:    { kind: 'heal', label: 'SOPORTE',  verb: 'repara' },
    leech:    { kind: 'atk',  label: 'DRENA',    verb: 'drena' },
    glitcher: { kind: 'deb',  label: 'GLITCH',   verb: 'desestabiliza' },
    buffer:   { kind: 'buff', label: 'PROTOCOLO',verb: 'potencia' },
    scout:    { kind: 'util', label: 'EXPLORA',  verb: 'explora' },
    silencer: { kind: 'deb',  label: 'SILENCIO', verb: 'silencia' },
    mirror:   { kind: 'def',  label: 'ESPEJO',   verb: 'refleja' }
  };

  const FACE_COLORS = [
    '#5dff88','#4db8ff','#ff6a90','#e8c44a','#c8a0ff','#7ad4c8',
    '#ff9a5c','#90b0ff','#b8e060','#ff80b0','#60d4ff','#d4a060'
  ];
  const FACES = [
    { eyes: '· ·', mouth: '─' }, { eyes: '• •', mouth: '﹀' }, { eyes: '◦ ◦', mouth: '‿' },
    { eyes: '◉ ◉', mouth: '︵' }, { eyes: '× ×', mouth: '▬' }, { eyes: '◈ ◈', mouth: '─' },
    { eyes: '· ·', mouth: '⌣' }, { eyes: '• •', mouth: '︿' }, { eyes: '◦ ◦', mouth: '─' },
    { eyes: '▣ ▣', mouth: '﹀' }, { eyes: '◆ ◆', mouth: '─' }, { eyes: '○ ○', mouth: '‿' }
  ];

  const FIRST = [
    'Nox','Vera','Kade','Sil','Ryn','Osha','Pell','Juno','Tars','Echo',
    'Mira','Vex','Lumen','Orin','Sable','Nyx','Casp','Reed','Wren','Ash',
    'Quill','Dusk','Hex','Ivy','Knot','Lark','Moss','Pike','Rook','Sol',
    'Thorn','Umbra','Vail','Wisp','Yarrow','Zed','Bram','Cinder','Drift','Flint'
  ];
  const RANK = [
    '01','02','03','04','05','06','07','08','09','10',
    '11','12','14','15','17','18','19','21','22','23',
    'A','B','C','D','E','K','M','R','S','X'
  ];

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const roleKeys = Object.keys(ROLES);
  const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic'];
  const CARDS = [];
  let n = 0;

  for (let i = 0; i < FIRST.length; i++) {
    for (let j = 0; j < 6; j++) {
      const roleKey = roleKeys[(i + j * 3) % roleKeys.length];
      const role = ROLES[roleKey];
      const h = hash(FIRST[i] + RANK[j] + roleKey + String(i));
      const power = 2 + (h % 7);
      const cost = 1 + (h % 3);
      const rarity = rarities[h % rarities.length];
      const face = FACES[h % FACES.length];
      const name = FIRST[i] + '-' + RANK[(i + j) % RANK.length];
      const id = 'u' + String(++n).padStart(3, '0');
      
  const LORE_BITS = [
    'Fue reclutado tras un fallo de continuidad en Sala 12.',
    'Su expediente marca "residual". Nadie firmó el alta.',
    'Habla poco. El protocolo lo prefiere así.',
    'Lleva el sello de un operador que ya no aparece en el archivo.',
    'Una copia imperfecta de otra tropa dada de baja.',
    'Responde a estímulos de eco. A veces responde de más.',
    'Asignado a contención menor. Hoy es todo lo que hay.',
    'No recuerda la última entrevista. El archivo sí.',
    'Su cara se sincroniza mal con el terminal.',
    'Clasificación interna: útil hasta que deje de serlo.',
    'Viene de un sobre abierto en un turno que no debió existir.',
    'El Supervisor lo menciona en notas al margen.',
    'Nunca ha visto la Oficina. Solo el pasillo.',
    'Prefiere órdenes cortas. Las largas las interpreta mal.',
    'Hay dos registros con el mismo código. Este es el que quedó.'
  ];
  function makeLore(card, h) {
    const bit = LORE_BITS[h % LORE_BITS.length];
    return card.name + ' · rol ' + card.label + '.\n' + bit + '\nCoste de despliegue: ' + card.cost + ' energía.';
  }

      const card = {
        id, name, role: roleKey, kind: role.kind, label: role.label, verb: role.verb,
        power, cost, rarity, face,
        faceColor: FACE_COLORS[h % FACE_COLORS.length],
        eyes: face.eyes, mouth: face.mouth,
        dmg: role.kind === 'atk' ? power : 0,
        shield: role.kind === 'def' ? power : 0,
        heal: role.kind === 'heal' ? power : 0,
        drain: roleKey === 'leech' ? Math.max(1, Math.floor(power * 0.65)) : 0,
        debuff: (roleKey === 'glitcher' || roleKey === 'silencer') ? power : 0,
        buff: roleKey === 'buffer' ? power : 0,
        util: roleKey === 'scout' ? 1 : 0,
        mirror: roleKey === 'mirror' ? 1 : 0,
        blurb: name + ' ' + role.verb + '.',
        lore: (function(){
          const bit = LORE_BITS[h % LORE_BITS.length];
          const origin = ['Sala 12','Archivo residual','Pasillo B','Núcleo','Terminal de operadores','Zona de eco'][h % 6];
          const note = ['No responde a llamadas fuera de protocolo.','Marcado como intercambiable.','Prefiere turnos cortos.','El Supervisor lo ha citado una vez.','Su código se repite en otro sobre.','Aprobado sin firma legible.'][h % 6];
          return name + ' — ' + role.label + '\nOrigen: ' + origin + '.\n' + bit + '\n' + note + '\nDespliegue: ' + cost + ' ⚡ · potencia base ' + power + '.';
        })()
      };
      // leech still needs mild dmg path via drain only
      if (roleKey === 'leech') card.dmg = 0;
      CARDS.push(card);
      if (n >= 210) break;
    }
    if (n >= 210) break;
  }

  const STARTER_IDS = CARDS.filter(c => c.rarity === 'common').slice(0, 14).map(c => c.id);

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
      (poolByR[c.rarity] = poolByR[c.rarity] || []).push(c);
    });
    const out = [];
    for (let i = 0; i < pack.count; i++) {
      const r = rollRarity(pack.weights);
      const pool = (poolByR[r] && poolByR[r].length) ? poolByR[r] : CARDS;
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return out;
  }
  function rollRarity(w) {
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k of Object.keys(w)) { r -= w[k]; if (r <= 0) return k; }
    return 'common';
  }

  function effectText(c) {
    const parts = [];
    if (c.dmg) parts.push(c.dmg + ' daño');
    if (c.shield) parts.push('+' + c.shield + ' escudo');
    if (c.heal) parts.push('+' + c.heal + ' vida');
    if (c.drain) parts.push('drena ' + c.drain);
    if (c.debuff) parts.push('debilita ' + c.debuff);
    if (c.buff) parts.push('potencia +' + c.buff);
    if (c.util) parts.push('+1 tropa');
    if (c.mirror) parts.push('refleja el golpe');
    return parts.join(' · ') || c.label;
  }

  g.TSCards = {
    CARDS, STARTER_IDS, PACKS, ROLES,
    getCard, openPack, effectText,
    count: CARDS.length
  };
})(typeof window !== 'undefined' ? window : global);
