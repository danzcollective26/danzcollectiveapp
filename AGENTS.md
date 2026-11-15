# DANZ Collective

Este repositorio contiene la app DANZ Collective. Mantener las decisiones y el
trabajo pendiente en `docs/ARCADANZ_ROADMAP.md` y distinguir siempre lo probado,
lo publicado y lo propuesto.

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
- Biblioteca con una entrada por juego y apertura inmersiva; motores y
  puntuaciones independientes. Vinyl Cut y Scratch Session son modos de Groove.
- Tres juegos aprobados para desarrollar: una arena original inspirada en
  Bomberman, Yeppo Pilla-Pilla y DANZ Kart Mini. Prioridad a duelos 1vs1 en el mismo
  móvil y después online; no presentar el modo online como terminado sin probarlo.
- Yeppo conserva la identidad de la flor de la bolsa. Movimientos coherentes,
  frases breves e ingeniosas y respeto a la preferencia de movimiento reducido.

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
