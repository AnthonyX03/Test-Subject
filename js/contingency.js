/* TEST SUBJECT — Contingencia (combate 1v1 con cartas) */
(function (g) {
  const UNIT_COMBAT = {
    u01: { name: 'UNIDAD 01', hp: 28, atk: 4, color: '#4db8ff', lines: {
      hit: ['Registro clínico alterado.', 'Patrón detectado.'],
      low: ['Signos vitales inestables… míos.'],
      win: ['Sujeto contenido.'],
      lose: ['Evaluación… interrumpida.']
    }},
    u02: { name: 'UNIDAD 02', hp: 26, atk: 5, color: '#ff6a90', lines: {
      hit: ['¿Eso es todo?', 'Me estás mirando demasiado.'],
      low: ['No cierres los ojos.'],
      win: ['Te vi primero.'],
      lose: ['…Interesante.']
    }},
    u03: { name: 'UNIDAD 03', hp: 30, atk: 4, color: '#e8c44a', lines: {
      hit: ['Salto de sector.', 'No confíes en el orden.'],
      low: ['El mapa miente.'],
      win: ['Continuidad restaurada.'],
      lose: ['Fragmento perdido.']
    }},
    u04: { name: 'UNIDAD 04', hp: 32, atk: 5, color: '#5dff88', lines: {
      hit: ['Anotado.', 'Eso también queda en el expediente.'],
      low: ['¿Sigues escribiendo?'],
      win: ['Caso cerrado en apariencia.'],
      lose: ['El test… no termina así.']
    }},
    u05: { name: 'UNIDAD 05', hp: 34, atk: 6, color: '#c8c8c8', lines: {
      hit: ['…', 'No estoy.'],
      low: ['Casi invisible.'],
      win: ['Recuperado.'],
      lose: ['…']
    }}
  };

  function createBattle(unitId, deckIds) {
    const u = UNIT_COMBAT[unitId] || UNIT_COMBAT.u04;
    const deck = (deckIds || []).slice();
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    return {
      unitId,
      unitName: u.name,
      unitColor: u.color,
      lines: u.lines,
      playerHp: 30,
      playerMax: 30,
      enemyHp: u.hp,
      enemyMax: u.hp,
      baseAtk: u.atk,
      energy: 3,
      maxEnergy: 3,
      shield: 0,
      enemyShield: 0,
      enemyDebuff: 0, // reduces next enemy atk
      playerBuff: 0,  // adds to next card dmg
      deck,
      hand: [],
      discard: [],
      turn: 1,
      log: [],
      over: false,
      won: false,
      mirror: false
    };
  }

  function draw(state, n) {
    for (let i = 0; i < n; i++) {
      if (state.hand.length >= 7) break;
      if (!state.deck.length) {
        if (!state.discard.length) break;
        state.deck = state.discard.splice(0);
        for (let a = state.deck.length - 1; a > 0; a--) {
          const b = Math.floor(Math.random() * (a + 1));
          const t = state.deck[a]; state.deck[a] = state.deck[b]; state.deck[b] = t;
        }
      }
      if (state.deck.length) state.hand.push(state.deck.pop());
    }
  }

  function startTurn(state) {
    state.energy = state.maxEnergy;
    state.shield = Math.floor(state.shield * 0.35); // partial keep
    draw(state, state.hand.length ? 2 : 5);
    state.log.push({ who: 'sys', t: '— Turno ' + state.turn + ' —' });
  }

  function playCard(state, handIndex) {
    if (state.over) return { ok: false, reason: 'fin' };
    const id = state.hand[handIndex];
    const card = g.TSCards && TSCards.getCard(id);
    if (!card) return { ok: false, reason: 'carta' };
    if (state.energy < card.cost) return { ok: false, reason: 'energía' };

    state.energy -= card.cost;
    state.hand.splice(handIndex, 1);
    state.discard.push(id);

    let msg = card.name + ' · ';
    let dmg = card.dmg + (state.playerBuff || 0);
    if (card.dmg) state.playerBuff = 0;

    if (dmg > 0) {
      let dealt = dmg;
      if (state.enemyShield > 0) {
        const ab = Math.min(state.enemyShield, dealt);
        state.enemyShield -= ab;
        dealt -= ab;
      }
      state.enemyHp = Math.max(0, state.enemyHp - dealt);
      msg += dealt + ' daño';
      if (state.lines && state.lines.hit) {
        state.log.push({ who: 'enemy', t: state.lines.hit[Math.floor(Math.random() * state.lines.hit.length)] });
      }
    }
    if (card.shield) {
      state.shield += card.shield;
      msg += (msg.endsWith('· ') ? '' : '. ') + '+' + card.shield + ' guarda';
    }
    if (card.heal) {
      state.playerHp = Math.min(state.playerMax, state.playerHp + card.heal);
      msg += (msg.includes('daño') || msg.includes('guarda') ? '. ' : '') + '+' + card.heal + ' integridad';
    }
    if (card.drain) {
      let dealt = card.drain;
      state.enemyHp = Math.max(0, state.enemyHp - dealt);
      state.playerHp = Math.min(state.playerMax, state.playerHp + dealt);
      msg += ' drenó ' + dealt;
    }
    if (card.debuff) {
      state.enemyDebuff += card.debuff;
      msg += ' debilita ' + card.debuff;
    }
    if (card.buff) {
      state.playerBuff += card.buff;
      msg += ' potenció +' + card.buff;
    }
    if (card.mirror) {
      state.mirror = true;
      msg += ' espejo activo';
    }
    if (card.util) {
      // scan: draw 1
      draw(state, 1);
      msg += ' +1 carta';
    }

    state.log.push({ who: 'you', t: msg });
    if (state.enemyHp <= 0) {
      state.over = true;
      state.won = true;
      state.log.push({ who: 'sys', t: (state.lines.lose || ['Unidad caída.'])[0] });
    }
    return { ok: true };
  }

  function endTurn(state) {
    if (state.over) return;
    // Enemy act
    let atk = state.baseAtk + Math.floor(state.turn / 3) + Math.floor(Math.random() * 3);
    if (state.enemyDebuff > 0) {
      atk = Math.max(1, atk - state.enemyDebuff);
      state.enemyDebuff = 0;
    }
    // enemy gains light shield sometimes
    if (Math.random() < 0.25) {
      state.enemyShield += 2 + Math.floor(Math.random() * 3);
      state.log.push({ who: 'enemy', t: 'La unidad levanta un protocolo de contención (+escudo).' });
    }

    if (state.mirror) {
      state.enemyHp = Math.max(0, state.enemyHp - Math.floor(atk * 0.7));
      state.mirror = false;
      state.log.push({ who: 'sys', t: 'Espejo: parte del golpe vuelve (' + Math.floor(atk * 0.7) + ').' });
    }

    let dealt = atk;
    if (state.shield > 0) {
      const ab = Math.min(state.shield, dealt);
      state.shield -= ab;
      dealt -= ab;
    }
    state.playerHp = Math.max(0, state.playerHp - dealt);
    state.log.push({ who: 'enemy', t: state.unitName + ' responde · ' + dealt + ' daño a tu integridad.' });

    if (state.playerHp <= 0) {
      state.over = true;
      state.won = false;
      state.log.push({ who: 'sys', t: (state.lines.win || ['Recuperado.'])[0] });
      return;
    }
    if (state.enemyHp <= 0) {
      state.over = true;
      state.won = true;
      return;
    }
    if (state.enemyHp <= state.enemyMax * 0.3 && state.lines.low) {
      state.log.push({ who: 'enemy', t: state.lines.low[Math.floor(Math.random() * state.lines.low.length)] });
    }

    state.turn++;
    startTurn(state);
  }

  g.TSContingency = {
    UNIT_COMBAT, createBattle, draw, startTurn, playCard, endTurn
  };
})(typeof window !== 'undefined' ? window : global);
