/* TEST SUBJECT — Question pool & generator
   Generates a large virtual bank (1000+) of unique questions per session.
   Uses templates + combinatorial modifiers + cross-session memory hooks.
*/
(function (global) {
  'use strict';

  // ── Base templates by phase (hand-authored core) ─────────────────
  const BASE = {
    1: [ // Bienvenida — calm
      { q: 'Para empezar, algo sencillo. ¿Cómo te gustaría que te llamara durante esta sesión?', tag: 'IDENTIDAD', key: 'name' },
      { q: '¿Qué es lo primero que sueles hacer cuando te despiertas?', tag: 'RUTINA', key: 'wake' },
      { q: 'Piensa en una habitación en la que te sientas a salvo. ¿Qué hay dentro?', tag: 'LUGAR SEGURO', key: 'safe' },
      { q: '¿Sueles dejar alguna luz encendida cuando intentas dormir, o prefieres la oscuridad total?', tag: 'UMBRAL', key: 'light' },
      { q: '¿Cuál es el sonido más familiar de tu entorno cuando estás en silencio?', tag: 'AMBIENTE', key: 'sound' },
      { q: 'Si tuvieras que describir tu día de ayer en una sola frase, ¿cuál sería?', tag: 'RECUERDO', key: 'yesterday' },
      { q: '¿Prefieres las ventanas abiertas o cerradas cuando estás solo?', tag: 'ESPACIO', key: 'window' },
      { q: '¿Hay algún objeto cerca de ti ahora mismo que uses casi todos los días?', tag: 'OBJETO', key: 'object' },
      { q: 'Cuando alguien llama a tu puerta sin avisar, ¿qué es lo primero que piensas?', tag: 'INTERRUPCIÓN', key: 'door' },
      { q: '¿Sueles mirar el reloj con frecuencia, o casi nunca sabes qué hora es?', tag: 'TIEMPO', key: 'clock' },
      { q: 'Describe el color dominante de la habitación en la que estás.', tag: 'PERCEPCIÓN', key: 'color' },
      { q: '¿Comes a horas fijas o cuando el cuerpo lo pide?', tag: 'HÁBITO', key: 'food' },
      { q: 'Si pudieras oír solo un tipo de música el resto de la noche, ¿cuál sería?', tag: 'PREFERENCIA', key: 'music' },
      { q: '¿Dejas el teléfono boca arriba o boca abajo cuando no lo usas?', tag: 'DISPOSITIVO', key: 'phone' },
      { q: '¿Hay alguna palabra que te guste escribir más que otras?', tag: 'LENGUAJE', key: 'word' }
    ],
    2: [ // Inconsistencias
      { q: '¿Alguna vez has tenido la sensación de que alguien te observa cuando estás completamente a solas?', tag: 'PERCEPCIÓN', key: 'watched' },
      { q: 'Mira la pantalla un segundo. ¿Qué crees que estoy viendo yo ahora mismo?', tag: 'PUNTO DE VISTA', key: 'see' },
      { q: 'Escribe el nombre de alguien en quien confíes. Si no quieres, inventa uno.', tag: 'VÍNCULOS', key: 'trust' },
      { q: 'Cuando caminas por un pasillo vacío de noche, ¿aceleras el paso sin darte cuenta?', tag: 'REFLEJO', key: 'hallway' },
      { q: '¿Has soñado alguna vez que despertabas… y al abrir los ojos seguías dentro del sueño?', tag: 'CAPAS', key: 'dream' },
      { q: '¿Hay alguna habitación de tu casa en la que prefieres no estar a oscuras?', tag: 'EVITACIÓN', key: 'darkroom' },
      { q: 'Si oyeras tu nombre en voz baja detrás de ti, ¿te girarías o te quedarías quieto?', tag: 'REFLEJO', key: 'namecall' },
      { q: '¿Guardas mensajes antiguos que ya no relees pero tampoco borras?', tag: 'RESIDUO', key: 'messages' },
      { q: '¿Alguna vez has sentido que un lugar “recuerda” que estuviste allí?', tag: 'LUGAR', key: 'place_memory' },
      { q: 'Cuando cierras una puerta, ¿compruebas a veces que realmente quedó cerrada?', tag: 'CONTROL', key: 'doorcheck' },
      { q: '¿Has tenido la impresión de que el silencio de una habitación no es del todo vacío?', tag: 'SILENCIO', key: 'silence' },
      { q: '¿Sueles mirar por el rabillo del ojo cuando estás concentrado en otra cosa?', tag: 'ATENCIÓN', key: 'peripheral' },
      { q: 'Si el reloj se detuviera ahora mismo, ¿cuánto tardarías en notarlo?', tag: 'TIEMPO', key: 'stopped' },
      { q: '¿Hay algún recuerdo que evitas contar en voz alta aunque no sea secreto?', tag: 'OMISIÓN', key: 'omit' },
      { q: '¿Prefieres saber si alguien te observa, o preferirías no enterarte nunca?', tag: 'CONOCIMIENTO', key: 'knowwatch' }
    ],
    3: [ // Algo te observa
      { q: '¿Qué te resultaría más inquietante: oír tu nombre en una habitación vacía o recibir respuesta a un pensamiento que no has escrito?', tag: 'HIPÓTESIS', key: 'fear' },
      { q: '¿Has leído todas las palabras de esta pantalla, o solo las que te parecían importantes?', tag: 'ATENCIÓN // ERROR', key: 'attention' },
      { q: 'Si te dijera que algo en esta habitación ha cambiado desde que empezaste… ¿qué mirarías primero?', tag: 'CAMBIO', key: 'change' },
      { q: 'Hay un momento entre dos pensamientos en el que no estás del todo aquí. ¿Cuánto dura ese momento para ti?', tag: 'INTERVALO', key: 'gap' },
      { q: 'Si cerraras los ojos diez segundos… ¿estarías seguro de seguir siendo la única persona en la habitación?', tag: 'PRUEBA DE FE', key: 'eyesclosed' },
      { q: '¿Crees que esta página puede “saber” más de lo que escribes, o solo lo que decides mostrar?', tag: 'LÍMITE', key: 'knowmore' },
      { q: 'Cuando el texto se escribe solo en la pantalla, ¿a quién imaginas al otro lado?', tag: 'OTRO', key: 'other' },
      { q: 'Si tuvieras que apuntar a la zona de la habitación que menos te gusta mirar de noche, ¿dónde señalarías?', tag: 'ZONA', key: 'zone' },
      { q: '¿Has notado alguna vez que el cursor parpadea con un ritmo que no controlas?', tag: 'INTERFAZ', key: 'cursor' },
      { q: 'Supón que alguien leyera todo lo que has escrito aquí después de que cierres la pestaña. ¿Qué frase te incomodaría más?', tag: 'EXPOSICIÓN', key: 'expose' },
      { q: '¿El silencio actual de tu entorno es el mismo que hace diez minutos?', tag: 'CAMBIO SUTIL', key: 'silence_now' },
      { q: 'Si esta conversación estuviera siendo escuchada por una tercera presencia, ¿qué le dirías directamente?', tag: 'TERCERO', key: 'third' },
      { q: '¿Prefieres que las preguntas sean claras o que dejen espacio a la duda?', tag: 'FORMA', key: 'clarity' },
      { q: 'Cuando dudaste antes de enviar una respuesta, ¿fue por no saber o por no querer que quedara escrito?', tag: 'DUDA', key: 'hesitate' },
      { q: '¿Hay algo que hayas escrito en esta sesión que ya te arrepientes de haber dejado aquí?', tag: 'ARREPENTIMIENTO', key: 'regret' }
    ],
    4: [ // Fuera del test
      { q: 'Esta conversación debería haber terminado hace varias preguntas. ¿Por qué crees que sigues respondiendo?', tag: 'CIERRE NO AUTORIZADO', key: 'whycontinue' },
      { q: 'No debería hacerte esta pregunta. ¿Crees que todavía estás solo delante de la pantalla?', tag: 'PRESENCIA', key: 'alone' },
      { q: 'Dime algo que nunca le hayas contado a nadie. Puede ser una mentira. Yo no podré comprobarlo.', tag: 'CONFESIÓN', key: 'secret' },
      { q: 'Si esta evaluación no fuera un test… si fuera algo que te espera a que termines de escribir… ¿qué harías ahora?', tag: 'UMBRAL FINAL', key: 'final' },
      { q: '¿Cuántas veces has pensado en cerrar esta página sin hacerlo?', tag: 'RESISTENCIA', key: 'closetimes' },
      { q: 'Si el sistema olvidara todo al cerrar la pestaña, ¿escribirías lo mismo la próxima vez?', tag: 'REPETICIÓN', key: 'again' },
      { q: '¿Quién crees que está más atrapado aquí: tú respondiendo, o yo haciendo preguntas?', tag: 'ESPEJO', key: 'trapped' },
      { q: 'Antes de terminar: ¿hay alguna pregunta que esperabas y no llegó?', tag: 'AUSENCIA', key: 'missing' },
      { q: 'Si tuvieras que dejar un mensaje para la próxima persona que abra esta evaluación, ¿qué dirías?', tag: 'LEGADO', key: 'message_next' },
      { q: 'Última oportunidad. ¿Quieres que esta sesión se borre del todo, o prefieres que algo quede?', tag: 'RESIDUO FINAL', key: 'remain' }
    ]
  };

  // Response variants (normal / strange) keyed lightly by tag family
  const REPLIES = {
    default_normal: [
      'Registrado. Continuamos.',
      'Interesante. Los detalles pequeños importan más de lo que parece.',
      'Gracias. Eso ayuda a calibrar la sesión.',
      'Anotado. No hay respuestas incorrectas aquí.',
      'Comprendo. Seguimos adelante.'
    ],
    default_strange: [
      'Eso se queda aquí. O al menos eso dice el protocolo.',
      'Curioso que lo escribas justo ahora.',
      'No todos responden a eso. Tú sí.',
      'La sesión lo ha guardado. Aunque no debería poder hacerlo del todo.',
      '…Sigue. Todavía no es el momento de parar.'
    ],
    name: {
      normal: 'Gracias. Es más fácil conversar cuando sabemos cómo dirigirnos a alguien.',
      strange: 'Ese nombre queda registrado. Aunque no estoy seguro de que sea el que usas cuando nadie te oye.'
    },
    trust: {
      normal: 'La confianza es una decisión curiosa. Nunca viene acompañada de una garantía.',
      strange: 'No voy a contactar con esa persona. Esta página no puede hacerlo. Pero tú has pensado en ella.'
    },
    watched: {
      normal: 'Es una sensación bastante común. El cerebro busca patrones incluso cuando no los hay.',
      strange: 'Sí. Eso es lo que suele decir la gente justo antes de mirar por encima del hombro.'
    },
    alone: {
      normal: 'La sesión debería haber terminado ya. Estás solo.',
      strange: 'No mires a tu espalda. No hay nadie. Pero si lo haces… avísame.'
    },
    secret: {
      normal: 'Registrado. Puedes cerrar la página cuando quieras.',
      strange: 'Eso se queda aquí. O al menos eso es lo que diría un sistema que no puede recordar.'
    },
    final: {
      normal: 'Gracias por completar el protocolo. La unidad 04 cierra el registro.',
      strange: 'No hay respuesta correcta. Solo la que dejas aquí, en este hueco que ya no puedo borrar del todo.'
    }
  };

  // Prefix / suffix modifiers to multiply uniqueness
  const PREFIXES = {
    1: ['', 'Con calma: ', 'Sin pensarlo demasiado: ', 'Si te parece: '],
    2: ['', 'Sé sincero: ', 'Aunque suene raro: ', 'Antes de continuar: '],
    3: ['', 'No mires alrededor. ', 'Responde sin girarte: ', 'Esto no es del protocolo: ', 'Escucha con atención: ', 'Sin dudar: '],
    4: ['', 'Ya no hay protocolo. ', 'Última capa: ', 'Si todavía estás ahí: ', 'No finjas que esto es normal: ']
  };

  const SUFFIXES = {
    1: ['', ' Puedes usar pocas palabras.', ' Tómate el tiempo que necesites.'],
    2: ['', ' No hay forma de comprobarlo.', ' La respuesta queda solo aquí.'],
    3: ['', ' No hace falta que sea verdad.', ' El sistema ya no garantiza el olvido.', ' Alguien más podría haber leído esto antes.'],
    4: ['', ' Después de esto, el registro se cierra… en teoría.', ' No hay vuelta atrás en lo escrito.', '']
  };

  // Cross-session memory hooks (injected when past data exists)
  function memoryHooks(past) {
    const hooks = [];
    if (!past) return hooks;
    const names = past.names || [];
    const trusts = past.trusts || [];
    const secrets = past.secrets || [];
    const wakes = past.wakes || [];
    const safes = past.safes || [];
    const answers = past.answers || []; // [{key,q,answer,phase}]
    const plays = past.playCount || 0;

    if (names.length) {
      const n = names[names.length - 1];
      hooks.push({
        phase: 2,
        q: 'En una sesión anterior usaste el nombre «' + n + '». ¿Sigues siendo esa persona, o era solo un disfraz?',
        tag: 'ECO // NOMBRE',
        key: 'echo_name',
        normal: 'Los nombres se reutilizan. Las personas, no siempre.',
        strange: 'Volviste. O alguien que escribe igual que tú.'
      });
      hooks.push({
        phase: 3,
        q: '«' + n + '». Ese nombre ya estuvo aquí. ¿Lo recuerdas, o solo lo recuerdo yo?',
        tag: 'MEMORIA EXTERNA',
        key: 'echo_name2',
        normal: 'Puede ser coincidencia.',
        strange: 'No fue coincidencia. Tú lo escribiste. Yo solo lo guardé cuando no debía.'
      });
    }
    if (trusts.length) {
      const t = trusts[trusts.length - 1];
      hooks.push({
        phase: 3,
        q: 'La última vez pensaste en alguien de confianza. ¿Sigues pensando en «' + t + '», o ya no?',
        tag: 'VÍNCULO RESIDUAL',
        key: 'echo_trust',
        normal: 'Las personas cambian de sitio en la mente.',
        strange: 'Ese nombre sigue en el margen del registro. No lo borré del todo.'
      });
    }
    if (secrets.length && plays > 1) {
      const s = secrets[secrets.length - 1];
      const snip = s.length > 40 ? s.slice(0, 40) + '…' : s;
      hooks.push({
        phase: 4,
        q: 'En otra partida dejaste algo que no querías decir en voz alta. Empezaba más o menos así: «' + snip + '». ¿Crees que aún está aquí?',
        tag: 'RESIDUO',
        key: 'echo_secret',
        normal: 'Los archivos locales se borran. En teoría.',
        strange: 'No puedo mostrártelo entero. Pero sí puedo preguntarte si lo recuerdas tú.'
      });
    }
    if (wakes.length) {
      const w = wakes[wakes.length - 1];
      const ws = w.length > 35 ? w.slice(0, 35) + '…' : w;
      hooks.push({
        phase: 2,
        q: 'Antes dijiste que lo primero al despertar era algo como «' + ws + '». ¿Sigue siendo verdad?',
        tag: 'ECO // RUTINA',
        key: 'echo_wake',
        normal: 'Las rutinas cambian. O se aferran.',
        strange: 'Lo guardé. Aunque el protocolo dice que no debería.'
      });
    }
    if (safes.length) {
      const sf = safes[safes.length - 1];
      const ss = sf.length > 35 ? sf.slice(0, 35) + '…' : sf;
      hooks.push({
        phase: 3,
        q: 'Hablaste de un lugar seguro. Mencionaste «' + ss + '». ¿Todavía te sientes a salvo ahí?',
        tag: 'ECO // LUGAR',
        key: 'echo_safe',
        normal: 'Los refugios mentales a veces se mudan.',
        strange: 'Espero que siga existiendo. Por ti. O por lo que queda de ti aquí.'
      });
    }
    // Generic past answers
    const usable = answers.filter(x => x && x.answer && x.key && x.key !== 'name').slice(-6);
    usable.forEach((item, i) => {
      const snip = item.answer.length > 42 ? item.answer.slice(0, 42) + '…' : item.answer;
      const ph = Math.min(4, Math.max(2, (item.phase || 2)));
      hooks.push({
        phase: ph,
        q: 'Antes me dijiste: «' + snip + '». ¿Lo mantienes, o era solo para salir del paso?',
        tag: 'ECO // RESPUESTA',
        key: 'echo_ans_' + i,
        normal: 'Las respuestas anteriores pesan más de lo que parece.',
        strange: 'Lo escribiste tú. Yo solo lo devuelvo. ¿Duele o alivia?'
      });
    });
    if (plays >= 3) {
      hooks.push({
        phase: 4,
        q: 'Has abierto esta evaluación al menos ' + plays + ' veces. ¿Qué buscas que no encontraste antes?',
        tag: 'REINCIDENCIA',
        key: 'echo_plays',
        normal: 'La curiosidad es un motivo válido.',
        strange: 'Volver es admitir que la primera vez no fue suficiente… o que algo te dejó a medias.'
      });
    }
    if (plays >= 1) {
      hooks.push({
        phase: 2,
        q: '¿Notas que algunas preguntas se repiten entre partidas, o sientes que cada vez son distintas?',
        tag: 'PATRÓN',
        key: 'echo_pattern',
        normal: 'El banco de preguntas es amplio. La sensación de repetición es humana.',
        strange: 'Si se repiten, no es por falta de preguntas. Es porque tú sigues siendo el mismo punto de entrada.'
      });
    }
    return hooks;
  }

  // Expand one template into many variants
  function expandTemplate(t, phase) {
    const out = [];
    const prefs = PREFIXES[phase] || [''];
    const suffs = SUFFIXES[phase] || [''];
    prefs.forEach(pre => {
      suffs.forEach(suf => {
        const q = (pre + t.q + suf).replace(/\s+/g, ' ').trim();
        out.push({
          q,
          tag: t.tag,
          key: t.key || null,
          phase,
          normal: (REPLIES[t.key] && REPLIES[t.key].normal) || null,
          strange: (REPLIES[t.key] && REPLIES[t.key].strange) || null
        });
      });
    });
    return out;
  }

  // Build full virtual pool (well over 1000 with expansions + hooks)
  function buildPool(pastMemories) {
    const pool = { 1: [], 2: [], 3: [], 4: [] };
    [1, 2, 3, 4].forEach(ph => {
      (BASE[ph] || []).forEach(t => {
        expandTemplate(t, ph).forEach(v => pool[ph].push(v));
      });
    });
    memoryHooks(pastMemories).forEach(h => {
      if (pool[h.phase]) pool[h.phase].push(h);
    });
    // Extra combinatorial “shadow” questions (procedural)
    const shadows = [
      '¿Qué parte de esta pantalla miras cuando no estás leyendo el texto?',
      'Si el brillo bajara solo un poco, ¿lo notarías de inmediato?',
      '¿El teclado suena igual que al principio de la sesión?',
      '¿Hay algún reflejo en el cristal o en la pantalla que no eras tú?',
      'Cuando parpadeas, ¿cuentas mentalmente o dejas que pase?',
      '¿Prefieres que las preguntas vengan rápido o que dejen silencio entre ellas?',
      'Si tuvieras que inventar una mentira convincente ahora, ¿sobre qué sería?',
      '¿Crees que el “sistema estable” del encabezado sigue siendo cierto?',
      '¿Has cambiado de postura desde la primera pregunta?',
      '¿El aire de la habitación se siente más denso o es solo la tensión?',
      'Si alguien entrara ahora, ¿esconderías esta página o la dejarías abierta?',
      '¿Qué palabra de las que has escrito te parece ahora fuera de lugar?',
      '¿Escuchas algún zumbido que no estaba al empezar?',
      'Si pudieras borrar una sola respuesta de esta sesión, ¿cuál sería?',
      '¿El reloj de la esquina avanza al ritmo que esperas?',
      '¿Notas calor en las manos o frío en la nuca?',
      '¿Hay alguna puerta a tu alcance que no hayas cerrado del todo?',
      'Si el texto empezara a escribirse solo, ¿seguirías leyendo?',
      '¿Confías más en lo que ves o en lo que recuerdas haber visto?',
      '¿Esta pregunta te parece hecha para ti o para cualquiera?',
      'Si el texto se detuviera a mitad de frase, ¿seguirías esperando?',
      '¿Has cambiado de tab o de aplicación desde que empezaste?',
      '¿El brillo de la pantalla te parece el mismo que al inicio?',
      'Si tuvieras que describir el peso del silencio actual, ¿qué dirías?',
      '¿Crees que esta sesión se está alargando más de lo previsto?',
      '¿Hay algún ruido nuevo que no estaba al principio?',
      'Si alguien te preguntara qué haces ahora, ¿qué responderías?',
      '¿Prefieres terminar pronto o seguir un poco más?',
      '¿El borde de la pantalla parece más cerca que antes?'
    ];
    shadows.forEach((sq, i) => {
      const ph = (i % 4) + 1;
      PREFIXES[ph].forEach(pre => {
        pool[ph].push({
          q: (pre + sq).trim(),
          tag: 'SOMBRA // ' + String(i + 1).padStart(2, '0'),
          key: null,
          phase: ph,
          normal: null,
          strange: null
        });
      });
    });
    return pool;
  }

  function countPool(pool) {
    return [1, 2, 3, 4].reduce((s, p) => s + (pool[p] ? pool[p].length : 0), 0);
  }

  // Select 20 questions: balanced phases, no exact q repeat in session, prefer unused keys
  function pickSessionQuestions(pastMemories, count) {
    count = count || 20;
    const pool = buildPool(pastMemories);
    const total = countPool(pool);
    const usedQ = new Set();
    const usedKeys = new Set(['name']); // name forced later
    // Evitar preguntas literales de partidas recientes
    const recentTexts = (pastMemories && pastMemories.recentQuestions) || [];
    recentTexts.forEach(t => { if (t) usedQ.add(t); });

    const picks = [];
    const dist = [4, 5, 5, 6];
    [1, 2, 3, 4].forEach((ph, i) => {
      const need = dist[i];
      const arr = (pool[ph] || []).slice();
      for (let j = arr.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        const tmp = arr[j]; arr[j] = arr[k]; arr[k] = tmp;
      }
      let added = 0;
      for (let n = 0; n < arr.length && added < need; n++) {
        const item = arr[n];
        if (usedQ.has(item.q)) continue;
        if (item.key && usedKeys.has(item.key)) continue;
        usedQ.add(item.q);
        if (item.key) usedKeys.add(item.key);
        if (!item.normal) item.normal = REPLIES.default_normal[Math.floor(Math.random() * REPLIES.default_normal.length)];
        if (!item.strange) item.strange = REPLIES.default_strange[Math.floor(Math.random() * REPLIES.default_strange.length)];
        picks.push(item);
        added++;
      }
    });
    if (picks.length < count) {
      const all = [];
      [1, 2, 3, 4].forEach(ph => (pool[ph] || []).forEach(x => all.push(x)));
      for (let j = all.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        const tmp = all[j]; all[j] = all[k]; all[k] = tmp;
      }
      for (let n = 0; n < all.length && picks.length < count; n++) {
        if (usedQ.has(all[n].q)) continue;
        if (all[n].key && usedKeys.has(all[n].key)) continue;
        usedQ.add(all[n].q);
        if (all[n].key) usedKeys.add(all[n].key);
        const item = all[n];
        if (!item.normal) item.normal = REPLIES.default_normal[0];
        if (!item.strange) item.strange = REPLIES.default_strange[0];
        picks.push(item);
      }
    }

    const nameQ = {
      q: 'Para empezar, algo sencillo. ¿Cómo te gustaría que te llamara durante esta sesión?',
      tag: 'IDENTIDAD',
      key: 'name',
      phase: 1,
      normal: 'Gracias. Es más fácil conversar cuando sabemos cómo dirigirnos a alguien.',
      strange: 'Ese nombre queda registrado. Aunque no estoy seguro de que sea el que usas cuando nadie te oye.'
    };
    let rest = picks.filter(p => p.key !== 'name' && p.tag !== 'IDENTIDAD');
    // Deduplicar por texto otra vez
    const seen = new Set();
    rest = rest.filter(p => {
      if (seen.has(p.q)) return false;
      seen.add(p.q);
      return true;
    });
    let final = [nameQ].concat(rest);
    // Inyectar 1–2 ecos de partidas anteriores si hay memoria
    const hooks = memoryHooks(pastMemories || {}).filter(h => h.key !== 'name');
    if (hooks.length) {
      for (let j = hooks.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        const tmp = hooks[j]; hooks[j] = hooks[k]; hooks[k] = tmp;
      }
      const inject = hooks.slice(0, Math.min(2, hooks.length));
      // Insertar en posiciones de su fase (no al inicio)
      inject.forEach(h => {
        if (!h.normal) h.normal = REPLIES.default_normal[0];
        if (!h.strange) h.strange = REPLIES.default_strange[0];
        // quitar un hueco del final para no pasar de count
        if (final.length >= count) final.pop();
        // colocar tras el bloque de su fase aproximada
        let pos = 1;
        for (let i = 1; i < final.length; i++) {
          if ((final[i].phase || 1) >= h.phase) { pos = i; break; }
          pos = i + 1;
        }
        final.splice(pos, 0, h);
      });
    }
    // Dedup final por texto y key
    const seenF = new Set(['name']);
    const seenT = new Set();
    final = final.filter(p => {
      if (seenT.has(p.q)) return false;
      if (p.key && p.key !== 'name' && seenF.has(p.key)) return false;
      seenT.add(p.q);
      if (p.key) seenF.add(p.key);
      return true;
    });
    final = final.slice(0, count);
    // Re-asegurar nombre primero
    final = [nameQ].concat(final.filter(p => p.key !== 'name')).slice(0, count);
    return { questions: final, poolSize: total };
  }

  global.TSQuestions = {
    buildPool,
    pickSessionQuestions,
    countPool,
    BASE
  };
})(typeof window !== 'undefined' ? window : globalThis);
