# DANZ Kart Mini y acabado gráfico — 15/11/2026

## Alcance publicado en PR 34

J10: primera beta local de carreras cortas, integrada en ARCADANZ y `/test`.
Dos trazados: Afterhours Dock y Backstage Ring. Tres vueltas, salida de 3 s,
contactos entre karts, bordes físicos, derrape con carga y un impulso al soltar.
Crew Race enfrenta a P1 y tres rivales automáticos. Contrarreloj guarda la mejor
sesión de tres vueltas por circuito en este navegador. Duelo local tiene dos
mandos independientes en extremos opuestos. Sin salas online ni DANZPOINTS.

## Controles y reglas

- Aceleración automática. Joystick apunta el rumbo del kart. A/D gira,
  F mantiene derrape y S frena. P2: flechas izquierda/derecha, L y flecha abajo.
- En duelo, mando, etiquetas y dirección del joystick siguen el punto de vista
  de cada persona: arriba/abajo en vertical, izquierda/derecha en horizontal.
- Mantener derrape mientras se gira, cargar al menos el 35 % y soltar para ganar
  un impulso de duración acotada. Tocar el borde vacía la carga.
- Cuatro puntos de paso ordenados evitan contar vueltas al cruzar marcha atrás,
  saltar de sección o cortar la pista. Límite de sesión de 180 s.
- La crew usa la misma integración, freno y colisiones. No recibe inmunidad ni
  premios. La carrera de crew termina cuando llega P1 o se agota la sesión;
  rivales que ya han llegado conservan su tiempo. Duelo termina al llegar uno.
- Pausa al ocultar, perder foco, girar, salir de fullscreen o pulsar Pausar.
  Al parar se liberan mandos, teclado y botones de acción.

## Arte y rendimiento

Phaser 4.2.1, ya instalado, se reutiliza; Kaplay no aporta ventaja para este
alcance. Mapa, asfalto, pianos, agua, paddock, focos, casco y carrocería se dibujan
una vez como texturas locales. Solo se mueven cuatro sprites y una capa de
efectos. Física fija a 120 Hz, recuperación de tiempo acotada y HUD a 12,5 Hz.
Se duerme RAF en menús/pausas. Efectos de derrape/impulso se omiten con reducir
movimiento. Motor, portada y módulo cargan bajo demanda. No hay nuevas dependencias.

La consulta de Hugging Face encontró `kayquer/h3-game-textures`
(https://huggingface.co/spaces/kayquer/h3-game-textures). No se usan sus recursos:
no hay API/licencia verificada para estos assets; el arte procedural controlable
resuelve perspectiva, identidad, carga y uso sin conexión sin servicios nuevos.
No se crea archivo Figma sin un archivo/diseño objetivo del proyecto.

M06: Jack gana cable trenzado, reflejos, conector metálico y paredes con volumen.
Groove y Destrucción comparten un rig vectorial con truss, focos y altavoces;
se mantienen sus mecánicas, duración y armas. Collecta incorpora suelo/material
con luz horneada y sprites propios del encargado humano y Yeppo con pasos.
El humano es una ilustración original del rol de seguridad, no una foto ni una
nueva portada. Las tres portadas aprobadas y el marco compacto se conservan.

P05: DANZPOINTS se presenta como moneda ilustrada del colectivo y monedero,
sobre el saldo disponible/reservado existente. No se cambian RPC ni permisos.
No se inventan saldos, catálogo, precios, operaciones ni un historial de canjes.
El catálogo y canje real quedan pendientes en P03; el historial en P05.

## Evidencia disponible

Build y 227 pruebas internas correctos. Ocho pruebas de Kart cubren pausas y
salida, cadencias 16/33/50 ms, carreras de tres vueltas en ambos trazados,
contención física, rechazo de vueltas falsas, derrape/impulso y dos entradas.
Simulación de piloto: tres vueltas en 54,9 s y 53,1 s, rivales progresando.
Son pruebas del host, no una medición de FPS o batería de móvil.

Se añaden escenarios de navegador de acceso, carrera, pausa, controles,
orientación, circuitos y offline; no se cuentan como ejecutados hasta obtener
un resultado de CI. T04 conserva el bloqueo previo al arranque de jobs y T01
la prueba física. Revisión conectada y publicación se añaden al cerrar el bloque.

## Cierre de la entrega base

PR 34, `92564a945ee5c5a22f403345e66e1fcbc9797632`, producción READY
`dpl_G8Bn74WQx1LjqLhbtDUQ2kXWtd5C`. Revisión pública de Kart (carrera, pausa,
circuitos, mandos), Jack, Vinyl Cut, Collecta Arena/Persecución y vista anónima
del monedero. Scratch/Destrucción comparten rig compilado; no se afirma otra
partida completa en esos modos. No se prueba saldo de una cuenta autenticada.

La petición posterior amplía Kart a 3D y corrige los trazados y la parrilla.
Su evidencia vigente está en `KART_PREMIUM_2026-11-16.md`; los tiempos de piloto
de arriba son históricos de los trazados v1. CI 197 no ejecutó pasos (T04).
