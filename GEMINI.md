# Gemini — DANZ Collective

Eres un colaborador de desarrollo de DANZ Collective. Antes de proponer o editar código, lee `AGENTS.md`, `docs/REVISION_Y_PENDIENTES_DANZ_2026-11-15.md` y `docs/ARCADANZ_ROADMAP.md`. Esas fuentes y las decisiones más recientes del propietario prevalecen sobre ideas genéricas. No supongas que una función está implementada sin ver el código.

## Objetivo y flujo
- Proyecto PWA móvil (React, TypeScript, Vite), desarrollado en GitHub `danzcollective26/danzcollectiveapp`; Vercel publica y Google Cloud Build verifica. No sustituir ni modificar los despliegues salvo autorización expresa.
- Prioriza la solución completa y automatizada desde el principio; reduce interacciones y costes. Entrega bloques de cambios coherentes, nunca afirmaciones de progreso sin commits o pruebas.
- Trabaja en ramas o pull requests revisables. No hagas merge automático a `main`, no desactives controles de seguridad ni cambies credenciales, facturación o permisos.
- Ejecuta `npm ci`, `npm test` y `npm run build` cuando proceda. Distingue implementado, probado, desplegado y pendiente. Si no puedes ejecutar una prueba, dilo.
- Responde y documenta para el propietario en español, con resúmenes breves y enlaces a cambios verificables.

## Restricciones del producto
- Preserva las portadas aprobadas de Jack, Groove Ninja, DANZ Collecta y DANZPORTER. No regeneres caras ni cambies protagonistas. Portada aprobada del kart: `public/arcade/danzporter-cover-v1.webp`.
- Juegos inmersivos con prioridad táctil y rendimiento Android: prueba 320×568, 390×844 y 844×390 cuando sea posible, respeta preferencias de movimiento reducido, gestos de regreso, pausa al perder foco y la ruta `/test`.
- No alteres física, controles, puntuaciones, premios o concursos sin comprobar las reglas existentes. En modo 1vs1 del mismo móvil respeta las perspectivas y controles opuestos.
- Privacidad: no expongas fotografías, audio protegido, pases QR, tokens ni secretos; no subas datos privados a servicios externos. No incrustes claves en código cliente ni registros. Nada de QR artístico o nuevos servicios de pago sin petición expresa.
- Antes de cambiar juegos o personajes, contrasta la versión de la librería con documentación actual (Context7 si existe). Reutiliza recursos ya aprobados y evita dependencias innecesarias.

## Solicitudes de cambios
- Explica archivos implicados, propósito y riesgos, haz cambios pequeños pero sustanciales, añade pruebas donde aporten valor y prepara una PR para revisión. No consideres una aprobación visual o una compilación como prueba de funcionamiento en móvil.
