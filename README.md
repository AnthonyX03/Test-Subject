# TEST SUBJECT — PWA rework

## Contenido
- `index.html`: juego completo en un solo HTML (estilos, preguntas, lógica y audio integrados).
- `manifest.webmanifest`: configuración instalable.
- `sw.js`: service worker para caché de la aplicación y funcionamiento offline tras la primera carga.
- `icons/`: iconos de instalación.

## Instalación / publicación
1. Sube el contenido de esta carpeta a la raíz de un sitio HTTPS, por ejemplo GitHub Pages.
2. Abre `index.html` desde el sitio publicado.
3. En Android/Chrome, usa el botón **INSTALAR TEST SUBJECT** de Ajustes cuando esté disponible. Si no aparece, abre el menú ⋮ del navegador y elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
4. La PWA requiere HTTPS (o localhost para pruebas). Abrir el HTML directamente como `file://` no permite instalar una PWA ni registrar el service worker.

## Partida guardada
Los datos se guardan localmente en el navegador. En Ajustes > Datos de la partida > **BORRAR PARTIDA GUARDADA** se eliminan la memoria, respuestas previas y finales desbloqueados tras pedir confirmación. Esto no borra la caché ni desinstala la aplicación.

## Audio
El juego intenta iniciar la música al entrar, pero Android/Chrome puede exigir una primera interacción del usuario por sus políticas de reproducción automática. Si ocurre, toca o pulsa una vez la página y el audio podrá comenzar.
