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
  function expandTemplate(t, phase, unitId) {
    unitId = unitId || 'u04';
    const pack = UNIT_PACKS[unitId] || {};
    const prefs = (pack.prefixes && pack.prefixes[phase]) || PREFIXES[phase] || [''];
    const suffs = (pack.suffixes && pack.suffixes[phase]) || SUFFIXES[phase] || [''];
    const out = [];
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
  function buildPool(pastMemories, unitId) {
    unitId = unitId || 'u04';
    const pack = UNIT_PACKS[unitId] || UNIT_PACKS.u04 || {};
    const pool = { 1: [], 2: [], 3: [], 4: [] };
    [1, 2, 3, 4].forEach(ph => {
      // Plantillas base + exclusivas de la unidad
      const templates = (BASE[ph] || []).slice();
      if (pack.extra && pack.extra[ph]) {
        pack.extra[ph].forEach(t => templates.push(t));
      }
      templates.forEach(t => {
        expandTemplate(t, ph, unitId).forEach(v => {
          v.unit = unitId;
          pool[ph].push(v);
        });
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
    const pack2 = UNIT_PACKS[unitId] || {};
    shadows.forEach((sq, i) => {
      const ph = (i % 4) + 1;
      const prefs = (pack2.prefixes && pack2.prefixes[ph]) || PREFIXES[ph] || [''];
      prefs.forEach(pre => {
        pool[ph].push({
          q: (pre + sq).trim(),
          tag: 'SOMBRA // ' + String(i + 1).padStart(2, '0'),
          key: null,
          phase: ph,
          unit: unitId,
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

  // ── Bancos exclusivos por unidad (plantillas + modificadores propios) ──
  const UNIT_PACKS = {
    u01: {
      prefixes: {
        1: ['', 'Registre: ', 'Con precisión: ', 'Sin adornos: ', 'Dato requerido: ', 'Responda: '],
        2: ['', 'Observe la discrepancia: ', 'Contraste: ', 'Verifique: ', 'No omita: '],
        3: ['', 'Anomalía posible: ', 'Cronometre: ', 'Aísle la variable: ', 'Clasifique: '],
        4: ['', 'Cierre parcial: ', 'Sin protocolo amable: ', 'Estado residual: ', 'Mida: ']
      },
      suffixes: {
        1: ['', ' Sea breve.', ' Evite metáforas.', ' Una frase basta.'],
        2: ['', ' No se corrija a mitad.', ' El tiempo cuenta.'],
        3: ['', ' No mire el reloj del sistema.', ' Anote solo lo verificable.'],
        4: ['', ' El expediente no espera.', ' No hay apelación.']
      },
      extra: {
        1: [
          { q: 'Indique su identificador preferido. Si no tiene, invente uno estable.', tag: 'ID', key: 'name' },
          { q: '¿A qué hora exacta inició esta sesión, según su reloj?', tag: 'TIEMPO', key: 'clock' },
          { q: 'Enumere tres objetos a menos de un metro de usted.', tag: 'INVENTARIO', key: 'object' },
          { q: '¿Ha completado evaluaciones clínicas previas? Sí, no o no recuerda.', tag: 'HISTORIAL', key: 'history' },
          { q: 'Describa su postura actual en una palabra.', tag: 'SOMA', key: 'posture' },
          { q: '¿Su entorno es silencioso, ruidoso o intermitente?', tag: 'AMBIENTE', key: 'sound' },
          { q: '¿La iluminación es artificial, natural o mixta?', tag: 'LUZ', key: 'light' },
          { q: 'Indique si está sentado, de pie o en otra posición.', tag: 'POSICIÓN', key: 'pose' }
        ],
        2: [
          { q: 'Su respuesta anterior, ¿la mantendría bajo juramento administrativo?', tag: 'COHERENCIA', key: 'oath' },
          { q: '¿Detecta alguna inconsistencia entre lo que piensa y lo que escribe?', tag: 'DISCREPANCIA', key: 'gap' },
          { q: 'Si el registro mostrara una respuesta distinta a la suya, ¿qué haría?', tag: 'REGISTRO', key: 'record' },
          { q: '¿Ha anticipado alguna pregunta de esta sesión?', tag: 'ANTICIPO', key: 'anticipate' },
          { q: 'Califique su nivel de fatiga del 1 al 10.', tag: 'FATIGA', key: 'fatigue' }
        ],
        3: [
          { q: '¿Conoce el término «anomalía de continuidad»?', tag: 'GLOSARIO', key: 'anomaly' },
          { q: 'Si su expediente se reabriera solo, ¿lo reportaría?', tag: 'PROTOCOLO', key: 'reopen' },
          { q: '¿Aceptaría que otra evaluación usara sus respuestas sin su nombre?', tag: 'ÉTICA', key: 'anon' },
          { q: '¿Cree que el tiempo entre pregunta y respuesta es medido?', tag: 'LATENCIA', key: 'latency' }
        ],
        4: [
          { q: 'Estado final autoasignado: completo, pendiente o residual.', tag: 'CIERRE', key: 'final' },
          { q: '¿Desea añadir una corrección al expediente? Si no, escriba «ninguna».', tag: 'ADDENDA', key: 'addenda' },
          { q: 'Confirme si está solo. Una sola palabra.', tag: 'PRESENCIA', key: 'alone' }
        ]
      }
    },
    u02: {
      prefixes: {
        1: ['', 'Con calma… ', 'Si te apetece decirlo: ', 'Sin prisa: ', 'Entre tú y yo: ', 'Cuando quieras: '],
        2: ['', 'Sé honesto conmigo: ', 'Aunque duela un poco: ', 'No hace falta que suene bien: ', 'Confía un segundo: '],
        3: ['', 'Quédate con la sensación: ', 'No mires hacia otro lado: ', 'Dime la verdad blanda: ', 'Si tiembla, también vale: '],
        4: ['', 'Ya casi no fingimos: ', 'Aquí no hay audiencia: ', 'Solo nosotros: ', 'Antes de que se cierre: ']
      },
      suffixes: {
        1: ['', ' Puedes usar pocas palabras.', ' No te juzgo por la forma.'],
        2: ['', ' Si no quieres nombres reales, inventa.', ' Respira si hace falta.'],
        3: ['', ' No tienes que ser valiente.', ' El silencio también es una respuesta… pero escribe algo.'],
        4: ['', ' Quédate un momento más.', ' No cierres todavía si no quieres.']
      },
      extra: {
        1: [
          { q: '¿Cómo te gustaría que te llamara esta noche?', tag: 'NOMBRE', key: 'name' },
          { q: '¿Cuándo fue la última vez que te sentiste realmente acompañado?', tag: 'VÍNCULO', key: 'trust' },
          { q: '¿Hay alguien a quien no hayas dicho algo importante?', tag: 'SECRETO', key: 'secret' },
          { q: '¿Qué parte de tu día te pesa más al recordarla?', tag: 'PESO', key: 'weight' },
          { q: 'Si pudieras oír una voz familiar ahora, ¿de quién sería?', tag: 'VOZ', key: 'voice' },
          { q: '¿Sueles pedir perdón aunque no sepas exactamente por qué?', tag: 'CULPA', key: 'guilt' },
          { q: '¿Qué te da miedo admitir en voz alta?', tag: 'MIEDO', key: 'fear' }
        ],
        2: [
          { q: '¿Me estás contando lo mismo que te contarías a alguien de confianza?', tag: 'HONESTIDAD', key: 'honest' },
          { q: 'Si desaparecieras un día, ¿quién lo notaría primero?', tag: 'AUSENCIA', key: 'gone' },
          { q: '¿Hay una habitación a la que no quieres volver?', tag: 'LUGAR', key: 'safe' },
          { q: '¿Prefieres que te entiendan o que te dejen en paz?', tag: 'DESEO', key: 'want' }
        ],
        3: [
          { q: '¿Sientes que esta conversación ya la has tenido con alguien más?', tag: 'ECO', key: 'echo' },
          { q: 'Si te dijera que me importas dentro de este protocolo, ¿me creerías?', tag: 'APEGO', key: 'care' },
          { q: '¿Qué necesitarías oír para quedarte un poco más?', tag: 'NECESIDAD', key: 'need' }
        ],
        4: [
          { q: '¿Quieres que recuerde tu nombre cuando esto termine?', tag: 'MEMORIA', key: 'name' },
          { q: 'Si solo pudieras dejar una frase en el expediente, ¿cuál sería?', tag: 'LEGADO', key: 'final' },
          { q: '¿Estás solo… de verdad?', tag: 'PRESENCIA', key: 'alone' }
        ]
      }
    },
    u03: {
      prefixes: {
        1: ['', 'Según el archivo: ', 'Antes de Continuidad: ', 'En esta iteración: ', 'Si el registro no miente: '],
        2: ['', 'Compare con la sesión anterior: ', 'Si ya lo respondió: ', 'Anomalía posible: ', 'No diga que es la primera vez: '],
        3: ['', 'Sala 12 no existe, y aun así: ', 'Sobre el 000: ', 'Si el expediente se escribe solo: ', 'Continuidad pregunta: '],
        4: ['', 'Sesión residual: ', 'Sin departamento listado: ', 'El cierre no cierra: ', 'Cuando termine de leer: ']
      },
      suffixes: {
        1: ['', ' El identificador importa.', ' No invente fechas.'],
        2: ['', ' Coincidencias no son consuelo.', ' El margen del archivo escucha.'],
        3: ['', ' No mire la puerta.', ' No confirme si oye dos voces.'],
        4: ['', ' No responda si pregunta por el lector.', ' El 000 sigue sin nombre.']
      },
      extra: {
        1: [
          { q: 'Identifíquese. Si no quiere, use un alias que pueda repetir.', tag: 'ID', key: 'name' },
          { q: '¿Ha estado aquí antes, según usted?', tag: 'REPETICIÓN', key: 'before' },
          { q: '¿Conoce la Sala 12?', tag: 'SALA', key: 'room' },
          { q: '¿Qué significa para usted la palabra continuidad?', tag: 'GLOSARIO', key: 'cont' },
          { q: '¿Sueña con entrevistas que no ha tenido?', tag: 'SUEÑO', key: 'dream' }
        ],
        2: [
          { q: 'Si el registro mostrara que ya respondió esto, ¿lo negaría?', tag: 'REGISTRO', key: 'deny' },
          { q: '¿Ha oído alguna vez una pregunta antes de leerla?', tag: 'ANTICIPO', key: 'anticipate' },
          { q: '¿Le suena el identificador 000?', tag: 'SUJETO', key: 'zero' },
          { q: '¿Confiaría en un expediente que cambia al abrirlo?', tag: 'NULL', key: 'null' }
        ],
        3: [
          { q: 'Si te preguntan si estás solo, ¿responderías?', tag: 'ADENDA', key: 'alone' },
          { q: '¿Quién autoriza los cierres de Continuidad?', tag: 'DEPTO', key: 'dept' },
          { q: '¿Ha desaparecido alguien que conociera tras un cuestionario?', tag: 'CONTACTO', key: 'gone' },
          { q: 'Cuando termine de leer… ¿qué cree que ocurre?', tag: 'SALA12', key: 'read' }
        ],
        4: [
          { q: '¿Esta sesión es nueva o una que vuelve a comenzar?', tag: 'RESIDUAL', key: 'residual' },
          { q: 'Escriba lo que no debería quedar en el archivo.', tag: 'SECRETO', key: 'secret' },
          { q: '¿Quién está leyendo esto ahora mismo?', tag: 'LECTOR', key: 'final' }
        ]
      }
    },
    u04: {
      prefixes: null, // usa los globales
      suffixes: null,
      extra: null
    },
    u05: {
      prefixes: {
        1: ['', '… ', 'si aún hay alguien: ', 'registro incompleto: ', 'sin operador: '],
        2: ['', 'la sesión ya había empezado: ', 'no preguntes por el entrevistador: ', 'eco: '],
        3: ['', '████: ', 'el expediente abierto: ', 'voz sin cuerpo: ', ' residual: '],
        4: ['', 'no hay final: ', 'reinicio: ', 'sujeto/entrevistador confuso: ', '…']
      },
      suffixes: {
        1: ['', ' …', ' si puedes.'],
        2: ['', ' no confirmes tu nombre dos veces.', ' el archivo ya te tiene.'],
        3: ['', ' no mires la silla vacía.', ' dos voces, una habitación.'],
        4: ['', ' la sesión continúa activa.', ' gracias por participar. otra vez.']
      },
      extra: {
        1: [
          { q: '¿Cómo te llamas… esta vez?', tag: 'ID', key: 'name' },
          { q: '¿Notas que esto ya ocurrió?', tag: 'LOOP', key: 'before' },
          { q: '¿Hay alguien en la silla?', tag: 'SALA', key: 'chair' },
          { q: '¿Quién habla, tú o el registro?', tag: 'VOZ', key: 'voice' }
        ],
        2: [
          { q: 'La respuesta ya está escrita. ¿La cambias igual?', tag: 'PRE', key: 'pre' },
          { q: '¿Desapareces si dejas de responder?', tag: 'EXIST', key: 'gone' },
          { q: '000. ¿Te dice algo?', tag: 'CERO', key: 'zero' }
        ],
        3: [
          { q: 'No leas la siguiente página. ¿La lees igual?', tag: 'NULL', key: 'null' },
          { q: '¿Estás solo? (no respondas si el expediente te lo pide)', tag: 'ADENDA', key: 'alone' },
          { q: '¿El entrevistador eres tú?', tag: 'ROL', key: 'role' }
        ],
        4: [
          { q: 'Gracias por participar. Vamos a comenzar… ¿otra vez?', tag: 'REINICIO', key: 'final' },
          { q: 'Escribe lo que el sistema no debería recordar.', tag: 'SECRETO', key: 'secret' },
          { q: '¿Quién queda cuando los demás dejan de aparecer?', tag: '000', key: 'zero' }
        ]
      }
    }
  };

  function pickSessionQuestions(pastMemories, count, unitId) {
    count = count || 20;
    unitId = unitId || 'u04';
    const pool = buildPool(pastMemories, unitId);
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
