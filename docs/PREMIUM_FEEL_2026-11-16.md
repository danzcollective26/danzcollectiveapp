# Premium feel — feature/premium-feel

## Alcance

Tres bloques solicitados por el propietario, con commits separados y entrega
mediante PR sobre `main`. La revisión de Scratch se conserva aparte en PR 47;
no forma parte de esta rama. No se cambian cuentas, permisos, puntos ni reglas
de los juegos.

### 1. Navegación y respuesta nativa

- `go()` usa View Transitions para cambiar la sección principal con una entrada
  breve. El último destino solicitado prevalece sobre callbacks atrasados;
  atrás/adelante cancela una transición pendiente.
- Fallback inmediato sin API, si falla la captura, al ocultar la pestaña o al
  reducir movimiento. Entradas/salidas de juegos mantienen sus gestos nativos.
- Haptics breves en navegación, favoritas y sello confirmado. Detección de API,
  activación del usuario, preferencia, pestaña visible y límite de frecuencia.
- Esqueletos accesibles en carga inicial de galerías y pasaporte; una sola
  descripción de estado y elementos decorativos ocultos a lectores de pantalla.

### 2. Galerías

- Fotos con decodificación asíncrona, placeholder, aparición suave y estado de
  error. El visor privado conserva la vista previa mientras carga el original.
- Las nuevas fotos locales grandes tienen miniatura WebP de hasta 640 px,
  guardada junto al original. GIF y fallos de conversión conservan el original.
  Los álbumes anteriores siguen funcionando, sin conversión masiva automática.
- Se reutilizan los `preview_path` privados existentes: no se crean URLs públicas,
  ni se modifican permisos de Storage. Retirada, caducidad y cambio de cuenta
  siguen limpiando la galería y el visor.
- Favoritas locales por cuenta/evento o álbum local. Persisten solo IDs,
  con validación y límite; sin imágenes, nombres ni URLs firmadas en localStorage.
- Filtro de favoritas, corazón en el visor y marcas en miniaturas. Los gestos,
  zoom, descarga del original y navegación del álbum se conservan.

### 3. Yeppo y pequeños detalles

- Idle más tranquilo: parpadeo ocasional, respiración mínima y saludo al enfocarlo.
  Respuestas con un gesto breve y reacción táctil al tocarlo durante un paseo.
- Se aparta cuando se escribe fuera de su charla. Las apariciones automáticas
  no invaden la pantalla con paseos; los tres paseos manuales y `/test` permanecen.
- Se oculta y detiene el intervalo al ocultar la pestaña. El primer saludo
  conserva su guía sin mover ni esconder el control de navegación pulsado.
- Sello nuevo: un pequeño golpe de tinta, brillo y vibración tras `granted` del
  servidor. `already_attended`, errores y simples cargas no celebran asistencia.
- Sonido original corto, opcional y apagado por defecto. Preferencias de sonido
  y vibración en el pasaporte; contextos de audio cerrados al terminar o fallar.
- Movimiento reducido mantiene señales estáticas y elimina las animaciones.

## Validación y límites

Pruebas de unidad: destinos rápidos/fallback, haptics opcionales, favoritas
aisladas y limitadas, silencio por defecto y cancelación del sonido al ocultar.
Pruebas de navegador: historial, fallback, esqueletos, miniaturas y bytes del
original, favoritas tras recargar, gesto de Yeppo, pausa y celebración confirmada.
Las capturas sintéticas y los resultados de build, móvil/tableta/escritorio y
offline quedan en el PR. No se acredita teléfono físico, FPS, batería ni vibración
o audio percibidos en un dispositivo real.

Revisión React: hooks estables, listeners/timers cancelados, estado privado
acotado a cuenta/evento, sin dependencias añadidas, notas de accesibilidad y
animaciones limitadas a transform/opacity. Se conservan los límites de RLS,
lecturas con plazo y comprobación de URLs ya existentes.

Documentación consultada: MDN (View Transitions, Vibration, decode y cancelación
de animaciones) mediante Context7; changelog y documentación oficial de Supabase.
Hugging Face consultado para miniaturas; se prefiere Canvas local, sin transmitir
fotografías a un servicio externo ni añadir costes o dependencias.
