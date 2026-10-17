/* TEST SUBJECT — Minijuegos de seguridad / prueba */
(function (g) {
  const WORDS5 = ['HORSE','REGAL','PLANT','GHOST','TRACE','SIGNAL','FRAME','PROBE','VAULT','NULLX','DELTA','ECHOO','SHIFT','BLEND','CRYPT'];
  const WORDS_HACK = ['BRAIN','BLAST','WHARF','HATCH','SLOTS','SPARK','CRANK','CRANE','FLOOD','CLOUD','TRACE','AGENT','NODE','VAULT','GHOST','PROBE','SIGNAL','FRAME'];

  function rand(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function likeness(a, b) {
    let n = 0;
    const A = a.toUpperCase(), B = b.toUpperCase();
    for (let i = 0; i < Math.min(A.length, B.length); i++) if (A[i] === B[i]) n++;
    return n;
  }

  /** 1 HACK — elegir contraseña (estilo terminal) */
  function createHack(root, onDone) {
    const secret = rand(WORDS_HACK.filter(w => w.length === 5));
    const pool = shuffle(WORDS_HACK.filter(w => w.length === 5).filter(w => w !== secret)).slice(0, 11).concat([secret]);
    const words = shuffle(pool);
    let tries = 4;
    root.innerHTML = '';
    const title = el('div', 'mg-title', 'SOBREESCRITURA DE SEGURIDAD');
    const sub = el('div', 'mg-sub', 'Selecciona la contraseña candidata. Intentos: <span id="mgTries">4</span>');
    const grid = el('div', 'mg-hack-grid');
    const log = el('div', 'mg-log');
    words.forEach(w => {
      const b = el('button', 'mg-word', w);
      b.type = 'button';
      b.onclick = () => {
        if (tries <= 0) return;
        tries--;
        const t = root.querySelector('#mgTries');
        if (t) t.textContent = String(tries);
        if (w === secret) {
          log.textContent = 'ACCESO CONCEDIDO.';
          setTimeout(() => onDone(true, 12), 500);
        } else {
          log.textContent = 'Denegado. Semejanza: ' + likeness(w, secret) + '/' + secret.length;
          if (tries <= 0) setTimeout(() => onDone(false, 0), 700);
        }
      };
      grid.appendChild(b);
    });
    root.append(title, sub, grid, log);
  }

  /** 2 OVERRIDE — wordle-like */
  function createOverride(root, onDone) {
    const secret = rand(WORDS5).slice(0, 5).toUpperCase();
    let row = 0;
    const max = 5;
    root.innerHTML = '';
    root.append(
      el('div', 'mg-title', 'SECURITY OVERRIDE'),
      el('div', 'mg-sub', 'Adivina la clave de 5 letras')
    );
    const board = el('div', 'mg-board');
    const rows = [];
    for (let r = 0; r < max; r++) {
      const line = el('div', 'mg-row');
      const cells = [];
      for (let c = 0; c < 5; c++) {
        const cell = el('div', 'mg-cell', '');
        line.appendChild(cell);
        cells.push(cell);
      }
      board.appendChild(line);
      rows.push(cells);
    }
    const input = el('input', 'mg-input');
    input.maxLength = 5;
    input.placeholder = 'ESCRIBE Y PULSA ENTER';
    input.autocomplete = 'off';
    const msg = el('div', 'mg-log', '');
    root.append(board, input, msg);
    setTimeout(() => input.focus(), 100);
    function submit() {
      const guess = (input.value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (guess.length !== 5) { msg.textContent = '5 letras.'; return; }
      const cells = rows[row];
      for (let i = 0; i < 5; i++) {
        cells[i].textContent = guess[i];
        if (guess[i] === secret[i]) cells[i].classList.add('ok');
        else if (secret.includes(guess[i])) cells[i].classList.add('mid');
        else cells[i].classList.add('bad');
      }
      if (guess === secret) {
        msg.textContent = 'CLAVE ACEPTADA';
        setTimeout(() => onDone(true, 15), 500);
        return;
      }
      row++;
      input.value = '';
      if (row >= max) {
        msg.textContent = 'FALLO. Era: ' + secret;
        setTimeout(() => onDone(false, 0), 900);
      }
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }

  /** 3 SEQUENCE — memorizar secuencia */
  function createSequence(root, onDone) {
    const symbols = ['◈', '◇', '◆', '○', '●', '△', '▽'];
    const seq = [];
    for (let i = 0; i < 4; i++) seq.push(rand(symbols));
    let phase = 'show';
    let player = [];
    root.innerHTML = '';
    const title = el('div', 'mg-title', 'SECUENCIA DE ACCESO');
    const sub = el('div', 'mg-sub', 'Memoriza y repite');
    const display = el('div', 'mg-seq-display', '…');
    const pad = el('div', 'mg-seq-pad');
    root.append(title, sub, display, pad);
    symbols.forEach(s => {
      const b = el('button', 'mg-seq-btn', s);
      b.type = 'button';
      b.onclick = () => {
        if (phase !== 'input') return;
        player.push(s);
        display.textContent = player.join(' ');
        if (player.length === seq.length) {
          const ok = player.every((v, i) => v === seq[i]);
          display.textContent = ok ? 'CORRECTO' : 'ERROR';
          setTimeout(() => onDone(ok, ok ? 10 : 0), 600);
        }
      };
      pad.appendChild(b);
    });
    let i = 0;
    function flash() {
      if (i >= seq.length) {
        phase = 'input';
        display.textContent = 'TU TURNO';
        display.style.opacity = '1';
        return;
      }
      display.textContent = seq[i];
      display.style.opacity = '1';
      // resaltar botón correspondiente
      const btns = pad.querySelectorAll('.mg-seq-btn');
      btns.forEach(b => {
        if (b.textContent === seq[i]) b.classList.add('flash');
        else b.classList.remove('flash');
      });
      setTimeout(() => {
        display.style.opacity = '0.35';
        display.textContent = '·';
        btns.forEach(b => b.classList.remove('flash'));
        i++;
        setTimeout(flash, 450);
      }, 900);
    }
    setTimeout(flash, 700);
  }

  /** 4 DECRYPT — ordenar letras */
  function createDecrypt(root, onDone) {
    const words = ['SALA12', 'SUJETO', 'ANOMALIA', 'EXPEDIENTE', 'CONTINUIDAD', 'ARCHIVO', 'NULL'];
    const word = rand(words);
    const letters = shuffle(word.split(''));
    let built = [];
    root.innerHTML = '';
    root.append(
      el('div', 'mg-title', 'DESCIFRADO DE EXPEDIENTE'),
      el('div', 'mg-sub', 'Ordena las letras')
    );
    const out = el('div', 'mg-decrypt-out', '_ '.repeat(word.length).trim());
    const pool = el('div', 'mg-decrypt-pool');
    letters.forEach((L, idx) => {
      const b = el('button', 'mg-word', L);
      b.type = 'button';
      b.dataset.i = String(idx);
      b.onclick = () => {
        if (b.disabled) return;
        b.disabled = true;
        built.push(L);
        out.textContent = built.join(' ') + (built.length < word.length ? ' ' + '_ '.repeat(word.length - built.length) : '');
        if (built.length === word.length) {
          const ok = built.join('') === word;
          out.textContent = ok ? word + ' ✓' : built.join('') + ' ✗ (' + word + ')';
          setTimeout(() => onDone(ok, ok ? 11 : 0), 700);
        }
      };
      pool.appendChild(b);
    });
    root.append(out, pool);
  }

  /** 5 SIGNAL — pulsa en zona */
  function createSignal(root, onDone) {
    root.innerHTML = '';
    root.append(
      el('div', 'mg-title', 'SINCRONIZAR SEÑAL'),
      el('div', 'mg-sub', 'Pulsa cuando el marcador entre en la zona verde')
    );
    const track = el('div', 'mg-signal-track');
    const zone = el('div', 'mg-signal-zone');
    const marker = el('div', 'mg-signal-marker');
    track.append(zone, marker);
    const btn = el('button', 'mg-word', 'CAPTURAR');
    btn.type = 'button';
    root.append(track, btn);
    let pos = 0, dir = 1, stopped = false;
    const id = setInterval(() => {
      if (stopped) return;
      pos += dir * 2.2;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      marker.style.left = pos + '%';
    }, 16);
    // zone 40-60%
    zone.style.left = '40%';
    zone.style.width = '20%';
    btn.onclick = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(id);
      const ok = pos >= 40 && pos <= 60;
      btn.textContent = ok ? 'SEÑAL BLOQUEADA' : 'FUERA DE FASE';
      setTimeout(() => onDone(ok, ok ? 9 : 0), 600);
    };
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  const TYPES = [
    { id: 'hack', name: 'Sobrescritura', run: createHack },
    { id: 'override', name: 'Override', run: createOverride },
    { id: 'sequence', name: 'Secuencia', run: createSequence },
    { id: 'decrypt', name: 'Descifrado', run: createDecrypt },
    { id: 'signal', name: 'Señal', run: createSignal }
  ];

  function startRandom(root, onDone) {
    const t = rand(TYPES);
    t.run(root, onDone);
    return t;
  }

  g.TSMinigames = { TYPES, startRandom };
})(typeof window !== 'undefined' ? window : global);
