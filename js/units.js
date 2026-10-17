/* TEST SUBJECT — Unidades de entrevista */
(function (g) {
  const UNITS = {
    u04: {
      id: 'u04', code: '04', name: 'UNIDAD 04', title: 'Entrevista de presencia', unlock: 0,
      colors: { bg: '#030805', green: '#5dff88', dim: '#2a8a45', panel: '#06140a', border: '#1f6b35', text: '#c8ffd4', muted: '#4a9a60' },
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
        { id: 'u04_clean', title: 'EXPEDIENTE ARCHIVADO', blurb: 'Evaluación rutinaria. Caso cerrado en apariencia.' , lore: 'Completaste la evaluación sin forzar el protocolo. Pocas contradicciones, poco ruido. La Unidad 04 archivó el caso como rutinario.\n\nCómo se alcanza: tensión baja, pocas anomalías, sesión estable de principio a fin.'},
        { id: 'u04_anomaly', title: 'INCONSISTENCIAS', blurb: 'Discrepancias menores. Seguimiento posible.' , lore: 'Hubo discrepancias menores entre lo que dijiste y lo que el registro guardó. No bastaron para abrir un caso mayor… pero el seguimiento puede reactivarse.\n\nCómo se alcanza: algo de inquietud, sin llegar al colapso del tono.'},
        { id: 'u04_mirror', title: '¿QUIÉN EVALÚA A QUIÉN?', blurb: 'El test terminó. Tú seguiste leyendo.' , lore: 'El test terminó en pantalla. Tú seguiste leyendo. La duda sobre quién observaba a quién quedó anotada al margen.\n\nCómo se alcanza: tensión media; respondiste lo suficiente para que el sistema te devolviera la mirada.'},
        { id: 'u04_pattern', title: 'PATRÓN DE CONTINUIDAD', blurb: 'Medían si respondías como quienes dejaron de aparecer.' , lore: 'Tus respuestas se acercaron al patrón de continuidad: el mismo “modo de dudar” que aparece en expedientes de quienes después dejaron de figurar.\n\nCómo se alcanza: alta tensión sin romper del todo el protocolo.'},
        { id: 'u04_open', title: 'CASO ABIERTO', blurb: 'La prueba acabó. El expediente, no.' , lore: 'La prueba acabó. El expediente no. La documentación pública lo advierte sin explicar el seguimiento.\n\nCómo se alcanza: tensión alta; el sistema prioriza contención sobre cierre amable.'},
        { id: 'u04_silent', title: 'PERFIL DE SILENCIO', blurb: 'Pocas palabras. El silencio también clasifica.' , lore: 'Respondiste con muy poco. El silencio también dibuja un perfil. La Unidad lo archiva con el mismo rigor que las confesiones largas.\n\nCómo se alcanza: muchas respuestas cortas o evasivas.'},
        { id: 'u04_leak', title: 'MATERIAL FILTRADO', blurb: 'Leíste de más. Ya no eres solo un participante.' , lore: 'Abriste demasiados cajones del archivo. Ya no eres solo un participante: conoces fragmentos que la U.E.C. prefería fuera de circulación.\n\nCómo se alcanza: muchos documentos desbloqueados en la misma trayectoria.'},
        { id: 'u04_break', title: 'RUPTURA DE PROTOCOLO', blurb: 'El tono institucional se quebró.' , lore: 'El tono institucional se quebró. Por un momento la entrevista dejó de sonar a procedimiento.\n\nCómo se alcanza: tensión muy alta; el protocolo no sostuvo la fachada.'},
        { id: 'u04_again', title: 'REINCIDENTE', blurb: 'Has vuelto demasiadas veces.' , lore: 'Has vuelto demasiadas veces. Dejaste de ser un desconocido: eres un hábito a medir.\n\nCómo se alcanza: varias partidas previas con tensión acumulada.'},
        { id: 'u04_witness', title: 'TESTIGO', blurb: 'Observaste el marco. El archivo te reconoce.' , lore: 'No solo contestaste: observaste el marco. Pasaste de caso a testigo.\n\nCómo se alcanza: documentos + tensión alta; atención al sistema, no solo a las preguntas.'}
      ]
    },
    u01: {
      id: 'u01', code: '01', name: 'UNIDAD 01', title: 'Evaluación clínica', unlock: 80,
      colors: { bg: '#02060e', green: '#4db8ff', dim: '#2a6aaa', panel: '#061018', border: '#1a5080', text: '#c0e4ff', muted: '#4a88b8' },
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
        { id: 'u01_ok', title: 'EVALUACIÓN VÁLIDA', blurb: 'Datos coherentes. Cierre administrativo.' , lore: 'Datos coherentes. Tiempos dentro de rango. Cierre administrativo sin marcas.\n\nCómo se alcanza: sesión limpia bajo Unidad 01.'},
        { id: 'u01_inc', title: 'DATOS INCONSISTENTES', blurb: 'Latencia o contradicción fuera de rango.' , lore: 'Latencia o contradicción fuera de tolerancia. El evaluador marca revisión.\n\nCómo se alcanza: respuestas inconsistentes o retrasos notables.'},
        { id: 'u01_time', title: 'LATENCIA ANÓMALA', blurb: 'Los tiempos de respuesta no cuadran.' , lore: 'Los intervalos pregunta-respuesta no cuadran con el modelo clínico.\n\nCómo se alcanza: pausas largas o ritmo irregular.'},
        { id: 'u01_pre', title: 'RESPUESTA ANTICIPADA', blurb: 'Hubo señales de anticipación al estímulo.' , lore: 'Hubo señales de anticipación al estímulo: como si la respuesta existiera antes que la pregunta.\n\nCómo se alcanza: tensión media-alta en evaluación clínica.'},
        { id: 'u01_flag', title: 'MARCADO PARA REVISIÓN', blurb: 'El expediente requiere supervisor.' , lore: 'El expediente requiere supervisor humano. La Unidad 01 no cierra sola.\n\nCómo se alcanza: anomalías repetidas bajo protocolo estricto.'},
        { id: 'u01_null', title: 'IDENTIDAD INCOMPLETA', blurb: 'Perfil incompleto. Estado pendiente.' , lore: 'Perfil incompleto. Identidad o bloque de respuestas insuficientes.\n\nCómo se alcanza: datos mínimos, evasión sistemática.'},
        { id: 'u01_dup', title: 'POSIBLE DUPLICADO', blurb: 'Coincidencia con otro registro activo.' , lore: 'Coincidencia estadística con otro registro activo. Posible duplicado o eco.\n\nCómo se alcanza: reincidencia + patrones similares a partidas anteriores.'},
        { id: 'u01_strict', title: 'PROTOCOLO ESTRICTO', blurb: 'Sin desviaciones. Caso de manual.' , lore: 'Sin desviaciones. Caso de manual. La Unidad 01 lo usa como referencia.\n\nCómo se alcanza: coherencia extrema, sin fricción.'},
        { id: 'u01_abort', title: 'SESIÓN ABORTADA', blurb: 'Condiciones no aptas. Registro parcial.' , lore: 'Condiciones no aptas. Registro parcial. La sesión se cortó antes del cierre ideal.\n\nCómo se alcanza: hostilidad o abandono del marco clínico.'},
        { id: 'u01_audit', title: 'AUDITORÍA PENDIENTE', blurb: 'Los datos no se archivan aún.' , lore: 'Los datos no se archivan aún. Auditoría pendiente de Continuidad… o de quien firme por ella.\n\nCómo se alcanza: documentos + inconsistencias clínicas.'}
      ]
    },
    u02: {
      id: 'u02', code: '02', name: 'UNIDAD 02', title: 'Sondeo emocional', unlock: 120,
      colors: { bg: '#0e0206', green: '#ff6a90', dim: '#aa3055', panel: '#18060c', border: '#8a2040', text: '#ffd0dc', muted: '#b85070' },
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
        { id: 'u02_hold', title: 'AÚN AQUÍ', blurb: 'Te quedaste. Eso ya es un final.' , lore: 'Te quedaste cuando podías irte. Para la Unidad 02, eso ya es un final.\n\nCómo se alcanza: sesión emocional estable, vínculo mantenido.'},
        { id: 'u02_trust', title: 'CONFIANZA FRÁGIL', blurb: 'Dijiste más de lo previsto.' , lore: 'Dijiste más de lo previsto. La confianza fue frágil, pero real en el registro.\n\nCómo se alcanza: respuestas personales abiertas.'},
        { id: 'u02_alone', title: 'SOLEDAD NOMBRADA', blurb: 'Admitiste el vacío. Quedó registrado.' , lore: 'Nombraste la soledad. Quedó escrita sin eufemismos.\n\nCómo se alcanza: admitir estar solo / vacío en sondeo afectivo.'},
        { id: 'u02_secret', title: 'SECRETO COMPARTIDO', blurb: 'Algo quedó entre tú y la unidad.' , lore: 'Algo quedó entre tú y la unidad. No es protocolo: es residuo íntimo.\n\nCómo se alcanza: compartir un secreto o miedo concreto.'},
        { id: 'u02_leave', title: 'QUIERO IRME', blurb: 'Pediste salir. El expediente recuerda cómo.' , lore: 'Pediste salir. El expediente recuerda el tono del pedido.\n\nCómo se alcanza: pedir ayuda, basta, o abandono emocional.'},
        { id: 'u02_care', title: 'DEMASIADO CERCA', blurb: 'El tono dejó de ser protocolo.' , lore: 'El tono dejó de ser procedimiento. Demasiado cerca para el manual.\n\nCómo se alcanza: tensión alta en Unidad 02; apego al diálogo.'},
        { id: 'u02_echo', title: 'YA HABÍAMOS HABLADO', blurb: 'La conversación pareció un eco.' , lore: 'La conversación pareció un eco de otra ya vivida.\n\nCómo se alcanza: reincidencia o sensación de “ya habíamos hablado”.'},
        { id: 'u02_name', title: 'NOMBRE GUARDADO', blurb: 'Pediste ser recordado. Lo serás.' , lore: 'Pediste ser recordado. La Unidad 02 guarda el nombre con otra prioridad.\n\nCómo se alcanza: insistir en el nombre / memoria al cierre.'},
        { id: 'u02_soft', title: 'CIERRE SUAVE', blurb: 'Sin gritos. Solo cansancio mutuo.' , lore: 'Sin gritos. Solo cansancio mutuo. Un cierre suave que aún pesa.\n\nCómo se alcanza: tensión media, respuestas honestas y agotadas.'},
        { id: 'u02_pull', title: 'NO CIERRES AÚN', blurb: 'Alguien —o algo— pidió un segundo más.' , lore: 'Alguien —o algo— pidió un segundo más. El archivo no confirma quién.\n\nCómo se alcanza: final de alta carga afectiva.'}
      ]
    },
    u03: {
      id: 'u03', code: '03', name: 'UNIDAD 03', title: 'Auditoría de continuidad', unlock: 160,
      colors: { bg: '#0a0802', green: '#e8c44a', dim: '#9a7a20', panel: '#161208', border: '#7a6020', text: '#ffe9a8', muted: '#a89040' },
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
        { id: 'u03_cont', title: 'APROBACIÓN DE CONTINUIDAD', blurb: 'Firmado por alguien que no está en el directorio.' , lore: 'Aprobación de Continuidad. Firmada por iniciales que no están en el directorio.\n\nCómo se alcanza: sesión de auditoría con cierre “válido” según el sistema.'},
        { id: 'u03_12', title: 'SALA 12', blurb: 'Cuando termine de leer…' , lore: 'Cuando termine de leer… La Sala 12 no existe en los planos. Sigue habiendo registros.\n\nCómo se alcanza: tensión media + temas de sala / lectura.'},
        { id: 'u03_000', title: 'SUJETO 000', blurb: 'El que queda cuando los demás dejan de aparecer.' , lore: 'El que queda cuando los demás dejan de aparecer. El 000 no tiene biografía verificable.\n\nCómo se alcanza: alta exposición a Continuidad / 000.'},
        { id: 'u03_null', title: 'UEC-NULL', blurb: 'El expediente se actualizó al leerte.' , lore: 'UEC-NULL se actualizó mientras leías. El sujeto creyó haber terminado.\n\nCómo se alcanza: muchos documentos de archivo filtrado.'},
        { id: 'u03_res', title: 'SESIÓN RESIDUAL', blurb: 'Cerrada y, aun así, activa.' , lore: 'Sesión residual: cerrada y, aun así, activa.\n\nCómo se alcanza: tensión alta bajo Unidad 03.'},
        { id: 'u03_two', title: 'DOS VOCES', blurb: 'Una habitación vacía. Dos hablantes.' , lore: 'Una habitación vacía. Dos hablantes. La cámara no explicó la segunda voz.\n\nCómo se alcanza: anomalías de presencia en auditoría.'},
        { id: 'u03_deny', title: 'ACCESO DENEGADO', blurb: 'El usuario todavía no ha sido registrado.' , lore: 'ACCESO DENEGADO. El usuario todavía no ha sido registrado.\n\nCómo se alcanza: chocar con permisos de Continuidad.'},
        { id: 'u03_map', title: 'BOTÓN SIN NÚMERO', blurb: 'El ascensor tenía una línea horizontal.' , lore: 'El ascensor tenía un botón sin número: solo una línea horizontal.\n\nCómo se alcanza: explorar pistas de planos / sede.'},
        { id: 'u03_ver', title: 'TRES VERSIONES', blurb: 'Elegiste una. Quedó registrada.' , lore: 'Elegiste una de las tres versiones. La elección también queda registrada.\n\nCómo se alcanza: documentar las teorías A/B/C.'},
        { id: 'u03_open', title: 'ARCHIVO ABIERTO', blurb: 'El estado del documento no cambia a cerrado.' , lore: 'El estado del documento no cambia a cerrado. Archivo abierto.\n\nCómo se alcanza: final testigo / residual de Continuidad.'}
      ]
    },
    u05: {
      id: 'u05', code: '05', name: 'UNIDAD 05', title: 'Sesión residual', unlock: 200,
      colors: { bg: '#000000', green: '#e0e0e0', dim: '#777', panel: '#0a0a0a', border: '#555', text: '#f0f0f0', muted: '#888' },
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
        { id: 'u05_loop', title: 'REINICIO', blurb: 'Gracias por participar. Vamos a comenzar…' , lore: 'Gracias por participar. Vamos a comenzar… El reinicio no pide permiso.\n\nCómo se alcanza: sesión residual que “gana” sin identidad clara.'},
        { id: 'u05_empty', title: 'SESIÓN SIN PARTICIPANTES', blurb: 'No se identificó entrevistador ni sujeto.' , lore: 'No se identificó entrevistador ni sujeto. Sesión sin participantes.\n\nCómo se alcanza: colapso de roles bajo Unidad 05.'},
        { id: 'u05_echo', title: 'YA HEMOS HECHO ESTO', blurb: 'Siempre empezáis igual.' , lore: 'Ya hemos hecho esto. Siempre empezáis igual.\n\nCómo se alcanza: reincidencia extrema en modo residual.'},
        { id: 'u05_chair', title: 'SILLA VACÍA', blurb: 'Todavía no.' , lore: 'Todavía no. La silla espera.\n\nCómo se alcanza: tensión media; presencia vacía.'},
        { id: 'u05_read', title: 'CUANDO TERMINE DE LEER', blurb: 'La grabación solo era texto.' , lore: 'La grabación solo era texto. Cuando termine de leer…\n\nCómo se alcanza: seguir hasta el final del material residual.'},
        { id: 'u05_glitch', title: '████', blurb: 'El nombre del operador no está disponible.' , lore: '████ — el nombre del operador no está disponible.\n\nCómo se alcanza: glitch total de identidad.'},
        { id: 'u05_active', title: 'SESIÓN EN CURSO', blurb: 'Después de «cerrada», volvió a abrirse.' , lore: 'Después de “cerrada”, la sesión volvió a abrirse.\n\nCómo se alcanza: tensión alta residual.'},
        { id: 'u05_000', title: 'SIN REGISTRO', blurb: '000 no ha sido localizado porque nunca fue registrado.' , lore: '000 no ha sido localizado porque nunca fue registrado.\n\nCómo se alcanza: contacto con el identificador vacío.'},
        { id: 'u05_both', title: 'DOS RESPUESTAS', blurb: 'No se pudo determinar cuál pertenecía al sujeto.' , lore: 'Dos respuestas. No se pudo determinar cuál pertenecía al sujeto.\n\nCómo se alcanza: contradicción irresoluble en 05.'},
        { id: 'u05_end', title: 'NO HA TERMINADO', blurb: '«No he terminado.» — respuesta fuera de fecha.' , lore: '«No he terminado.» — respuesta fuera de fecha.\n\nCómo se alcanza: el cierre más oscuro del modo residual.'}
      ]
    }
  };

  function getUnit(id) { return UNITS[id] || UNITS.u04; }
  function listUnits() { return Object.keys(UNITS).map(k => UNITS[k]); }
  function getEndings(unitId) { return (getUnit(unitId).endings || []).slice(); }

  g.TSUnits = { UNITS, getUnit, listUnits, getEndings };
})(typeof window !== 'undefined' ? window : global);
