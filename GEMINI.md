# Gemini — DANZ Collective

Eres un colaborador de desarrollo de DANZ Collective. Antes de proponer o editar código, lee `AGENTS.md`, `docs/REVISION_Y_PENDIENTES_DANZ_2026-11-15.md` y `docs/ARCADANZ_ROADMAP.md`. Esas fuentes y las decisiones más recientes del propietario prevalecen sobre ideas genéricas. No supongas que una función está implementada sin ver el código.

## Objetivo y flujo
- Proyecto PWA móvil (React, TypeScript, Vite), desarrollado en GitHub `danzcollective26/danzcollectiveapp`; Vercel publica y Google Cloud Build verifica. No sustituir ni modificar los despliegues salvo autorización expresa.
- Prioriza la solución completa y automatizada desde el principio; reduce interacciones y costes. Entrega bloques de cambios coherentes, nunca afirmaciones de progreso sin commits o pruebas.
- Trabaja en ramas o pull requests revisables. No hagas merge automático a `main`, no desactives controles de seguridad ni cambies credenciales, facturación o permisos.
- Ejecuta `npm ci`, `npm test` y `npm run build` cuando proceda. Distingue implementado, probado, desplegado y pendiente. Si no puedes ejecutar una prueba, dilo.
- Responde y documenta para el propietario en español, con resúmenes breves y enlaces a cambios verificables.

## Regla prioritaria: costes y autorización
- **Nunca** inicies por tu cuenta una llamada a Gemini API, Vertex AI, Cloud Run, Cloud Build, GitHub Actions con coste potencial, ni cualquier servicio de pago. No habilites facturación, prepago, recargas, suscripciones, cuotas de pago o servicios nuevos sin autorización **expresa, específica y previa** del propietario.
- Antes de cada ejecución que pueda gastar cuota o dinero: explica el servicio, qué se ejecutaría, el coste posible o que no es posible garantizar coste cero, el presupuesto y límites disponibles, y espera un «autorizo» inequívoco para esa operación concreta. El permiso dado para una operación NO se extiende a las siguientes.
- No presupongas que los créditos promocionales de Google Cloud cubren la API de Gemini. Un proyecto con facturación habilitada no implica consentimiento para gastar.
- Cuando no exista una garantía técnica de coste cero, limita el trabajo a leer código, editar archivos localmente o proponer cambios sin invocar APIs de pago. Prefiere el camino gratuito; si no es posible, detente y explica por qué.
- Los presupuestos y alertas de Google Cloud son avisos, no barreras duras de gasto. Nunca presentes una alerta como protección absoluta contra cargos.
- No publiques llaves ni tokens en respuestas, commits, logs, incidencias o capturas. Usa secretos del proveedor con privilegios mínimos, y jamás imprimas su valor.
- Las revisiones de GitHub Actions para Gemini solo se ejecutan manualmente tras activar la confirmación de coste para **cada** ejecución. No añadas `push`, `schedule` ni automatismos que puedan llamar a la API sin nuevo consentimiento.

## Restricciones del producto
- Preserva las portadas aprobadas de Jack, Groove Ninja, DANZ Collecta y DANZPORTER. No regeneres caras ni cambies protagonistas. Portada aprobada del kart: `public/arcade/danzporter-cover-v1.webp`.
- Juegos inmersivos con prioridad táctil y rendimiento Android: prueba 320×568, 390×844 y 844×390 cuando sea posible, respeta preferencias de movimiento reducido, gestos de regreso, pausa al perder foco y la ruta `/test`.
- No alteres física, controles, puntuaciones, premios o concursos sin comprobar las reglas existentes. En modo 1vs1 del mismo móvil respeta las perspectivas y controles opuestos.
- Privacidad: no expongas fotografías, audio protegido, pases QR, tokens ni secretos; no subas datos privados a servicios externos. No incrustes claves en código cliente ni registros. Nada de QR artístico o nuevos servicios de pago sin petición expresa.
- Antes de cambiar juegos o personajes, contrasta la versión de la librería con documentación actual (Context7 si existe). Reutiliza recursos ya aprobados y evita dependencias innecesarias.

## Solicitudes de cambios
- Explica archivos implicados, propósito y riesgos, haz cambios pequeños pero sustanciales, añade pruebas donde aporten valor y prepara una PR para revisión. No consideres una aprobación visual o una compilación como prueba de funcionamiento en móvil.
