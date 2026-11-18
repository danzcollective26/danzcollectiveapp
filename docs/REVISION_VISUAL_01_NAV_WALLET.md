# DANZ Collective — revisión visual 01: navegación y wallet

Estado: **propuesta implementada en rama**, pendiente de aprobación visual del propietario. No fusionada con main.

## Decisiones ya confirmadas
- Barra inferior fija móvil: **INICIO · FOTOS · ARCADANZ · EVENTOS · MÁS**.
- El quinto botón usa el componente de flor corporativa real, no un icono genérico de tres líneas.
- Eventos sigue dirigiendo al módulo DANZERS existente; los pases no se borran ni cambian.
- Pasaporte protagonista en Inicio, como una wallet compacta, y accesible desde Mi Cuenta y el menú MÁS.
- Fondo oscuro, blanco roto, secundarios violeta/agua del CSS actual y verde ácido solo para la selección y CTA.
- Conservar portada, flor, portadas de Arcade y logotipos originales. No usar el personaje robótico de los bocetos como Yeppo definitivo.

## Incluido en la rama
- Barra solo en pantallas móviles hasta 700px; escritorio mantiene su menú.
- Barra oculta al abrir un juego en modo inmersivo y durante la llegada rápida con pase.
- Panel MÁS para Pasaporte, DANZPOINTS, DANZ IN, DANZFLOR, Cuenta y Admin solo si hay autorización.
- Acceso a cartera en Inicio reutiliza ruta `pasaporte` y sus comprobaciones reales. Sin cifras, sellos, enlaces a fotos o recompensas simulados.
- Acomodación a safe areas y tamaños compactos; soporte para cerrar el panel al pulsar fuera, Escape o seleccionar una sección.
- No se modifican reglas de juego, autenticación, backend, galería, premios ni administración.

## Revisión y aceptación
- Abrir preview del PR y comprobar Inicio, wallet, panel MÁS, fotos, Eventos y regreso.
- Probar juego en vertical y horizontal: barra oculta al entrar; visible al salir.
- Comprobar Android físico, zoom de texto, safe-area y Yeppo/radio flotantes sin solapar controles.
- Sólo tras visto bueno explícito del propietario se fusiona a main.
- El diseño no se considera aprobado ni congelado por haber sido programado.

## Entregas externas
No se identificó una autoría de Grok inequívoca en nombres de rama/PR. Se conservan sin fusionar las ramas de trabajo ajenas; si se identifica su contenido se revisará antes de reimplementar funcionalidades coincidentes.

## Costes
No se activa Gemini, Google Cloud Storage, llamadas a APIs facturables ni compras.
