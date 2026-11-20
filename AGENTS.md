# DANZ Collective

Este repositorio contiene la app DANZ Collective. Mantener las decisiones y el
trabajo pendiente en `docs/ARCADANZ_ROADMAP.md` y distinguir siempre lo probado,
lo publicado y lo propuesto.


## Regla permanente: proteger el trabajo existente (todas las IA y colaboradores)

Antes de cualquier cambio, leer este archivo y la [issue #62](https://github.com/danzcollective26/danzcollectiveapp/issues/62) para prevenir regresiones. Aplicar estas reglas también cuando trabaje Grok, Codex, ChatGPT, un complemento o un desarrollador externo:

1. Leer el código, las decisiones aprobadas y los módulos afectados antes de editar. Conservar funcionalidades, datos, diseños, portadas, rutas y controles ya aprobados; no sustituir archivos íntegros sin revisar las diferencias.
2. Modificar en una rama con commits pequeños, sin alterar `main` ni producción antes de que el propietario pruebe y apruebe el bloque en el móvil.
3. Ejecutar `npm run build` y `npm test` (y Playwright/PWA cuando proceda). Dejar evidencia de qué se verificó y qué quedó sin probar; una compilación correcta no demuestra funcionamiento táctil.
4. Revisar RLS, migraciones y controles de consentimiento antes de tocar perfiles, Instagram, fotos privadas, puntos, sellos o cuentas. Nunca abrir información personal por conveniencia técnica.
5. En el PR: anotar comportamiento anterior, cambio, riesgos, pruebas, despliegue de prueba y reversión. No corregir un fallo destruyendo otra función.
6. Trabajar en bloques de tres o cuatro mejoras; comunicar avances reales y distinguir claramente código, compilación, despliegue, pruebas y aprobación. No afirmar actividad de fondo tras finalizar la respuesta.

## Seguimiento para no perder peticiones

- El registro general vigente es `docs/REVISION_Y_PENDIENTES_DANZ_2026-11-15.md`.
  Consultarlo junto con la hoja de ruta Arcade antes de continuar el proyecto.
- Incorporar cada nueva petición al registro, con identificador, estado,
  prioridad y siguiente acción. Conservar también tareas de app, música, fotos
  y materiales externos aunque el bloque activo sea Arcade.
- Al cerrar trabajo, actualizar la evidencia y el siguiente paso. Distinguir
  implementado, probado y publicado; una promesa o una tarjeta «próximamente»
  no completan una tarea. No volver a abrir un fallo resuelto sin nueva evidencia.
- Las decisiones posteriores del usuario prevalecen sobre documentos históricos.
  Yeppo Pilla-Pilla es persecución/escape con cambio de papeles, no tocar topos.
  QR artísticos, stems y trabajo online conservan sus estados separados.

Prioridad actual: biblioteca ARCADANZ, Yeppo, juegos y prueba móvil `/test`.
La nueva integración de QR artísticos queda aplazada hasta que el usuario la
necesite y la solicite; no dedicarle trabajo ni activarla en esta entrega.

## Hugging Face y herramientas gratuitas

1. Antes de programar una función nueva de imágenes, audio, QR, texto u otra
   capacidad relacionada, consultar la conexión de Hugging Face para comprobar
   si hay un Space o modelo activo que resuelva o mejore el trabajo. Verificar
   su API, licencia, disponibilidad y límites actuales; no añadir dependencias
   que no aporten una mejora concreta.
2. Priorizar e implementar primero opciones gratuitas, de código abierto o
   Spaces públicos con uso gratuito. No activar recursos de pago, duplicaciones
   con GPU de pago ni Endpoints dedicados sin autorización explícita.
3. Mencionar alternativas de pago solo cuando la mejora de calidad, velocidad
   o estabilidad sea muy grande y explicar el beneficio. La opción gratuita
   sigue siendo la predeterminada. Una cuenta o un token no elimina cuotas.
4. Las claves se usan únicamente en el servidor mediante variables de entorno.
   No incluirlas en Vite, Git, respuestas, registros ni ejemplos con valores reales.
   No enviar automáticamente fotos privadas, pases o datos de asistentes a Spaces.

## Arcade y Yeppo

- Utilizar las portadas exactas aprobadas de Jack y Groove Ninja. No rediseñarlas
  ni intercambiar a sus protagonistas.
- DANZ Collecta usa la portada «Día de cobro» aprobada el 15/11/2026, con el
  protagonista de seguridad y la factura pagada. Conservar esa imagen exacta.
- DANZPORTER es el nombre definitivo del antiguo Kart Mini. Conservar la portada
  exacta `public/arcade/danzporter-cover-v1.webp`, aprobada el 16/11/2026 con la
  nueva foto del propietario; no regenerarla ni sustituir su protagonista.
- Biblioteca con una entrada por juego y apertura inmersiva; motores y
  puntuaciones independientes. Vinyl Cut y Scratch Session son modos de Groove.
- La decisión posterior reúne Arena y Pilla-Pilla en **DANZ Collecta**: una sola
  entrada y una selección de modos Arena / Persecución. No crear otra tarjeta de
  Pilla-Pilla. Conservar las rutas directas antiguas. El tercer modo es
  **Contra la máquina — Último turno**, un rival automático local de Arena.
  En solitario se usa un mando P1 sin girar; el rival comparte física y reglas
  y no recibe entradas del teclado del segundo jugador. No confundirlo con online.
- En los duelos locales, una persona juega desde cada extremo opuesto del móvil.
  Girar juntos mando, etiquetas y flechas, y transformar la dirección al punto
  de vista de cada jugador; al cambiar la orientación, pausar y soltar las entradas.
- Collecta personaliza sus modos como Arena — Cierre de pista y Persecución —
  Pasa el marrón. Mantener el humor de seguridad/cierre/cuentas y las reglas reales
  de cada modo. Las facturas son ficción del Arcade, sin cobros o premios reales.
- Cada jugador puede elegir flechas o joystick táctil de forma independiente.
  Conservar ambas opciones, elección local, punto de vista enfrentado y retorno
  a cero al soltar, cancelar, pausar, perder foco o girar. Arena sigue usando
  cuatro direcciones por casillas; Persecución admite desplazamiento analógico.
- Tres juegos aprobados para desarrollar: una arena original inspirada en
  Bomberman, Yeppo Pilla-Pilla y DANZ Kart Mini. Prioridad a duelos 1vs1 en el mismo
  móvil y después online; no presentar el modo online como terminado sin probarlo.
- Yeppo conserva la identidad de la flor de la bolsa. Movimientos coherentes,
  frases breves e ingeniosas y respeto a la preferencia de movimiento reducido.

## Música protegida — decisión del propietario, 16/11

- Funky Fiesta y WTHIMH se reproducen con acceso protegido y sin botón de descarga.
- No subir audios, originales, copias, tokens o enlaces firmados a GitHub.
  Mantener Storage privado y emitir accesos breves tras verificar la sesión.
- No guardar audio protegido o enlaces firmados en precaché o localStorage.
  Ensayo debe seguir disponible sin cuenta y sin conexión.
- No afirmar que ocultar controles impide toda extracción o grabación.

## Documentación, complementos y prueba móvil

1. Antes de escribir o modificar código de juegos o del muñeco interactivo,
   consultar Context7, si está disponible, o la documentación oficial actual.
   Comprobar las versiones instaladas y las mejores prácticas de las librerías.
2. Siempre que se necesiten diseños, recursos visuales o el estado del proyecto,
   consultar proactivamente los complementos conectados pertinentes (Figma,
   GitHub, Vercel, Hugging Face, etc.). Verificar su respuesta y distinguir una
   conexión comprobada de una herramienta que necesita autorización o un archivo.
3. Al terminar cambios de juegos o animaciones, revisar el rendimiento y los
   controles táctiles en móvil. Corregir los problemas observados: gestos sin
   desplazamiento accidental, controles accesibles, limpieza de temporizadores,
   pausa al ocultar la pestaña, tamaño adaptable y movimiento reducido.
4. Mantener publicada y actualizada `/test`, con acceso desde el móvil a los
   juegos reales y demostraciones de Yeppo. No usar esa ruta para saltar permisos
   de cuentas, datos privados, administración o clasificación.
5. Regla obligatoria: cada vez que se complete una pantalla, un minijuego o una
   animación importante de Yeppo, antes de terminar la respuesta ejecutar una
   auditoría visual, de rendimiento móvil y de jugabilidad usando los complementos
   conectados y las herramientas de prueba disponibles. Dejar una lista de mejoras
   aplicadas o propuestas y explicar cualquier comprobación bloqueada. No afirmar
   una prueba de dispositivo físico, FPS o modo online si no se ha realizado.

Para nuevos juegos 2D evaluar primero Phaser y, si conviene por peso o alcance,
Kaplay. Para un futuro Yeppo 3D evaluar Three.js o React Three Fiber; conservar el
personaje y las animaciones actuales hasta verificar que la mejora justifica la
migración. No sustituir motores que ya funcionan únicamente por cambiar de librería.
