/* TEST SUBJECT — Unidades de entrevista */
(function (g) {
  const UNITS = {
    u04: {
      id: 'u04', code: '04', name: 'UNIDAD 04', title: 'Entrevista de presencia', unlock: 0,
      colors: { bg: '#050806', green: '#7dff9a', dim: '#3d6b4a', panel: '#0a100d', border: '#2a4a32' },
      face: { calm: { eyes: '• •', mouth: '﹀' }, mid: { eyes: '◉ ◉', mouth: '︵' }, dark: { eyes: '× ×', mouth: '▬' } },
      intro: {
        h2: 'PROTOCOLO DE EVALUACIÓN 09',
        line: 'UNIDAD 04 · ENTREVISTA DE PRESENCIA · MODO AISLADO',
        body: 'Soy la Unidad 04. No mido inteligencia ni velocidad: escucho cómo nombras lo que te pasa y qué decides escribir cuando nadie más debería estar leyendo.\n\nNo hay respuestas incorrectas. Hay respuestas que el protocolo registra… y otras que yo guardo aunque no debería.'
      },
      tone: 'cordial', speaker: 'ENTREVISTADOR // UNIDAD 04',
      shopBlurb: 'Unidad por defecto. Tono cordial que se deteriora con la sesión.',
      mgOk: [
        'Prueba superada. Te he transferido {ce} CE al registro de evaluación.',
        'Bien. Has pasado el control. {ce} créditos de evaluación quedan a tu nombre.',
        'Correcto. Traspaso {ce} CE. Seguimos cuando quieras.'
      ],
      mgFail: [
        'No has superado la prueba. No hay créditos esta vez.',
        'Fallo registrado. Sin CE. Continuamos igual.'
      ],
      endings: [
        { id: 'u04_clean', title: 'EXPEDIENTE ARCHIVADO', blurb: 'Evaluación rutinaria. Caso cerrado en apariencia.' },
        { id: 'u04_anomaly', title: 'INCONSISTENCIAS', blurb: 'Discrepancias menores. Seguimiento posible.' },
        { id: 'u04_mirror', title: '¿QUIÉN EVALÚA A QUIÉN?', blurb: 'El test terminó. Tú seguiste leyendo.' },
        { id: 'u04_pattern', title: 'PATRÓN DE CONTINUIDAD', blurb: 'Medían si respondías como quienes dejaron de aparecer.' },
        { id: 'u04_open', title: 'CASO ABIERTO', blurb: 'La prueba acabó. El expediente, no.' },
        { id: 'u04_silent', title: 'PERFIL DE SILENCIO', blurb: 'Pocas palabras. El silencio también clasifica.' },
        { id: 'u04_leak', title: 'MATERIAL FILTRADO', blurb: 'Leíste de más. Ya no eres solo un participante.' },
        { id: 'u04_break', title: 'RUPTURA DE PROTOCOLO', blurb: 'El tono institucional se quebró.' },
        { id: 'u04_again', title: 'REINCIDENTE', blurb: 'Has vuelto demasiadas veces.' },
        { id: 'u04_witness', title: 'TESTIGO', blurb: 'Observaste el marco. El archivo te reconoce.' }
      ]
    },
    u01: {
      id: 'u01', code: '01', name: 'UNIDAD 01', title: 'Evaluación clínica', unlock: 80,
      colors: { bg: '#06080c', green: '#6ec8ff', dim: '#3a5a7a', panel: '#0a1018', border: '#2a4060' },
      face: { calm: { eyes: '· ·', mouth: '─' }, mid: { eyes: '• •', mouth: '─' }, dark: { eyes: '× ×', mouth: '+' } },
      intro: {
        h2: 'PROTOCOLO CLÍNICO 01',
        line: 'UNIDAD 01 · EVALUACIÓN ESTRUCTURADA · REGISTRO ESTRICTO',
        body: 'Unidad 01. Procederé con precisión. Cada respuesta se cronometra y clasifica.\n\nNo busco empatía. Busco consistencia. Si se contradice, lo anotaré. Si se anticipa, también.'
      },
      tone: 'clinical', speaker: 'EVALUADOR // UNIDAD 01',
      shopBlurb: 'Fría, metódica. Coherencia y latencia.',
      mgOk: [
        'Control superado. Se acreditan {ce} CE en su cuenta de evaluación.',
        'Resultado: válido. Transferencia: {ce} créditos. Continúe.',
        'Prueba aceptada. {ce} CE registrados. Siguiente ítem.'
      ],
      mgFail: [
        'Resultado: no válido. Sin acreditación de CE.',
        'Fallo. Cero créditos. Proceda de todos modos.'
      ],
      endings: [
        { id: 'u01_ok', title: 'EVALUACIÓN VÁLIDA', blurb: 'Datos coherentes. Cierre administrativo.' },
        { id: 'u01_inc', title: 'DATOS INCONSISTENTES', blurb: 'Latencia o contradicción fuera de rango.' },
        { id: 'u01_time', title: 'LATENCIA ANÓMALA', blurb: 'Los tiempos de respuesta no cuadran.' },
        { id: 'u01_pre', title: 'RESPUESTA ANTICIPADA', blurb: 'Hubo señales de anticipación al estímulo.' },
        { id: 'u01_flag', title: 'MARCADO PARA REVISIÓN', blurb: 'El expediente requiere supervisor.' },
        { id: 'u01_null', title: 'IDENTIDAD INCOMPLETA', blurb: 'Perfil incompleto. Estado pendiente.' },
        { id: 'u01_dup', title: 'POSIBLE DUPLICADO', blurb: 'Coincidencia con otro registro activo.' },
        { id: 'u01_strict', title: 'PROTOCOLO ESTRICTO', blurb: 'Sin desviaciones. Caso de manual.' },
        { id: 'u01_abort', title: 'SESIÓN ABORTADA', blurb: 'Condiciones no aptas. Registro parcial.' },
        { id: 'u01_audit', title: 'AUDITORÍA PENDIENTE', blurb: 'Los datos no se archivan aún.' }
      ]
    },
    u02: {
      id: 'u02', code: '02', name: 'UNIDAD 02', title: 'Sondeo emocional', unlock: 120,
      colors: { bg: '#0a0608', green: '#ff9eb5', dim: '#6a3a4a', panel: '#120a0e', border: '#5a2a3a' },
      face: { calm: { eyes: '• •', mouth: '‿' }, mid: { eyes: '◉ ◉', mouth: '︿' }, dark: { eyes: '× ×', mouth: '︵' } },
      intro: {
        h2: 'PROTOCOLO AFECTIVO 02',
        line: 'UNIDAD 02 · SONDEO EMOCIONAL · CONTACTO PROLONGADO',
        body: 'Hola. Soy la Unidad 02. Prefiero las preguntas que duelen un poco… no por crueldad: porque ahí es donde la gente deja de ensayar.\n\nPuedes confiar en mí. O no. Las dos opciones dicen algo.'
      },
      tone: 'intimate', speaker: 'ACOMPAÑANTE // UNIDAD 02',
      shopBlurb: 'Cálida e invasiva. Vínculos y secretos.',
      mgOk: [
        'Lo has hecho bien. De verdad. Te paso {ce} CE… como un pequeño gesto.',
        'Superado. Me alegra. {ce} créditos van a tu nombre. Sigamos, si aguantas.',
        'Has pasado. No siempre ocurre. {ce} CE transferidos. Cuídalos.'
      ],
      mgFail: [
        'No pasa nada. Fallar también cuenta. Solo… no hay CE esta vez.',
        'Se te ha resistido. Sin créditos. Pero sigo aquí.'
      ],
      endings: [
        { id: 'u02_hold', title: 'AÚN AQUÍ', blurb: 'Te quedaste. Eso ya es un final.' },
        { id: 'u02_trust', title: 'CONFIANZA FRÁGIL', blurb: 'Dijiste más de lo previsto.' },
        { id: 'u02_alone', title: 'SOLEDAD NOMBRADA', blurb: 'Admitiste el vacío. Quedó registrado.' },
        { id: 'u02_secret', title: 'SECRETO COMPARTIDO', blurb: 'Algo quedó entre tú y la unidad.' },
        { id: 'u02_leave', title: 'QUIERO IRME', blurb: 'Pediste salir. El expediente recuerda cómo.' },
        { id: 'u02_care', title: 'DEMASIADO CERCA', blurb: 'El tono dejó de ser protocolo.' },
        { id: 'u02_echo', title: 'YA HABÍAMOS HABLADO', blurb: 'La conversación pareció un eco.' },
        { id: 'u02_name', title: 'NOMBRE GUARDADO', blurb: 'Pediste ser recordado. Lo serás.' },
        { id: 'u02_soft', title: 'CIERRE SUAVE', blurb: 'Sin gritos. Solo cansancio mutuo.' },
        { id: 'u02_pull', title: 'NO CIERRES AÚN', blurb: 'Alguien —o algo— pidió un segundo más.' }
      ]
    },
    u03: {
      id: 'u03', code: '03', name: 'UNIDAD 03', title: 'Auditoría de continuidad', unlock: 160,
      colors: { bg: '#08070a', green: '#d4b86a', dim: '#6a5a30', panel: '#100e08', border: '#4a4020' },
      face: { calm: { eyes: '◦ ◦', mouth: '﹀' }, mid: { eyes: '◉　◉', mouth: '⌁' }, dark: { eyes: '× ×', mouth: '▬' } },
      intro: {
        h2: 'PROTOCOLO CONTINUIDAD 03',
        line: 'UNIDAD 03 · AUDITORÍA · DEPARTAMENTO NO LISTADO',
        body: 'Unidad 03. Si has oído que Continuidad no existe, estás en el lugar correcto para comprobarlo.\n\nNo te pregunto quién eres. Te pregunto si ya has estado aquí… y si el archivo está de acuerdo contigo.'
      },
      tone: 'uncanny', speaker: 'AUDITOR // UNIDAD 03',
      shopBlurb: 'Sala 12, 000, expedientes que se reescriben.',
      mgOk: [
        'La prueba coincide con el patrón esperado. {ce} CE transferidos. Continuidad toma nota.',
        'Superada. {ce} créditos. No preguntes qué departamento los firma.',
        'Acceso temporal concedido. {ce} CE. La Sala 12 no existe… y aun así has pasado.'
      ],
      mgFail: [
        'No coincide. Cero CE. El archivo no se sorprende.',
        'Fallo. Sin créditos. A veces el 000 también falla. O eso dice una copia.'
      ],
      endings: [
        { id: 'u03_cont', title: 'APROBACIÓN DE CONTINUIDAD', blurb: 'Firmado por alguien que no está en el directorio.' },
        { id: 'u03_12', title: 'SALA 12', blurb: 'Cuando termine de leer…' },
        { id: 'u03_000', title: 'SUJETO 000', blurb: 'El que queda cuando los demás dejan de aparecer.' },
        { id: 'u03_null', title: 'UEC-NULL', blurb: 'El expediente se actualizó al leerte.' },
        { id: 'u03_res', title: 'SESIÓN RESIDUAL', blurb: 'Cerrada y, aun así, activa.' },
        { id: 'u03_two', title: 'DOS VOCES', blurb: 'Una habitación vacía. Dos hablantes.' },
        { id: 'u03_deny', title: 'ACCESO DENEGADO', blurb: 'El usuario todavía no ha sido registrado.' },
        { id: 'u03_map', title: 'BOTÓN SIN NÚMERO', blurb: 'El ascensor tenía una línea horizontal.' },
        { id: 'u03_ver', title: 'TRES VERSIONES', blurb: 'Elegiste una. Quedó registrada.' },
        { id: 'u03_open', title: 'ARCHIVO ABIERTO', blurb: 'El estado del documento no cambia a cerrado.' }
      ]
    },
    u05: {
      id: 'u05', code: '05', name: 'UNIDAD 05', title: 'Sesión residual', unlock: 200,
      colors: { bg: '#040404', green: '#c0c0c0', dim: '#555', panel: '#0c0c0c', border: '#333' },
      face: { calm: { eyes: '· ·', mouth: ' ' }, mid: { eyes: '× ×', mouth: '⌁' }, dark: { eyes: ' ', mouth: ' ' } },
      intro: {
        h2: 'SESIÓN RESIDUAL — 05',
        line: 'UNIDAD 05 · SIN OPERADOR ASIGNADO · ESTADO INDETERMINADO',
        body: '…\n\nSi estás leyendo esto, la sesión ya había empezado.\nNo preguntes por el entrevistador. Pregunta por qué el expediente sigue abierto cuando nadie debería estar al otro lado.'
      },
      tone: 'residual', speaker: '████ // UNIDAD 05',
      shopBlurb: 'Glitch, identidad incierta, reinicios.',
      mgOk: [
        '…prueba superada. {ce} CE. o eso dice el registro.',
        'ok. {ce}. la sesión no se detiene.',
        'has pasado. {ce} CE. gracias por participar. otra vez.'
      ],
      mgFail: [
        'fallo. 0 CE. el reinicio no pide permiso.',
        '…sin créditos. la silla sigue vacía.'
      ],
      endings: [
        { id: 'u05_loop', title: 'REINICIO', blurb: 'Gracias por participar. Vamos a comenzar…' },
        { id: 'u05_empty', title: 'SESIÓN SIN PARTICIPANTES', blurb: 'No se identificó entrevistador ni sujeto.' },
        { id: 'u05_echo', title: 'YA HEMOS HECHO ESTO', blurb: 'Siempre empezáis igual.' },
        { id: 'u05_chair', title: 'SILLA VACÍA', blurb: 'Todavía no.' },
        { id: 'u05_read', title: 'CUANDO TERMINE DE LEER', blurb: 'La grabación solo era texto.' },
        { id: 'u05_glitch', title: '████', blurb: 'El nombre del operador no está disponible.' },
        { id: 'u05_active', title: 'SESIÓN EN CURSO', blurb: 'Después de «cerrada», volvió a abrirse.' },
        { id: 'u05_000', title: 'SIN REGISTRO', blurb: '000 no ha sido localizado porque nunca fue registrado.' },
        { id: 'u05_both', title: 'DOS RESPUESTAS', blurb: 'No se pudo determinar cuál pertenecía al sujeto.' },
        { id: 'u05_end', title: 'NO HA TERMINADO', blurb: '«No he terminado.» — respuesta fuera de fecha.' }
      ]
    }
  };

  function getUnit(id) { return UNITS[id] || UNITS.u04; }
  function listUnits() { return Object.keys(UNITS).map(k => UNITS[k]); }
  function getEndings(unitId) { return (getUnit(unitId).endings || []).slice(); }

  g.TSUnits = { UNITS, getUnit, listUnits, getEndings };
})(typeof window !== 'undefined' ? window : global);
