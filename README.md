# TEST SUBJECT — Evaluación de presencia
**Protocolo 09 · Build 4.0 · PWA offline**

Experiencia interactiva de terror psicológico. Todo ocurre en el navegador.
No se envían datos a ningún servidor.

## Cómo usarlo

1. Descomprime el ZIP.
2. Abre `index.html` en un navegador moderno.
3. Opcional: instálalo como PWA (Chrome/Edge → “Instalar aplicación”).
4. Activa el audio desde la página (recomendado con auriculares).
5. Usa **⚙ AJUSTES** para sonido, modo móvil/PC, exportar/importar y finales.

## Novedades Build 4.0

- **20 preguntas por partida** elegidas de un banco de **+1000 variantes**.
- Cada partida es distinta; puede recordar nombres/confianza de partidas anteriores.
- **Pausa más larga** entre pregunta y pregunta (más si respondes muy rápido).
- Panel de **Ajustes**: sonido, adaptabilidad (Auto / Móvil / PC), exportar/importar partida.
- **Galería de finales** (5): se desbloquean al completar evaluaciones.
- Memoria local entre sesiones (`localStorage`).

## Contenido

```
test_subject_pwa/
├── index.html
├── manifest.json
├── sw.js
├── js/
│   ├── questions.js   → generador de banco (+1000)
│   └── app.js         → lógica del juego
├── icons/             → 16–512 px + maskable
└── README.md
```

## Finales (5)

1. Evaluación completada
2. Sesión cerrada con anomalías
3. ¿Quién está evaluando a quién?
4. El test nunca fue para ti
5. No cierres la pestaña todavía

Archivo: TS-09 / BUILD 4.0
