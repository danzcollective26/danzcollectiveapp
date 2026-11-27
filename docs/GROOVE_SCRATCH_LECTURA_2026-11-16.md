# Groove — lectura y precisión de Scratch, 16/11/2026

## Cambio de esta entrega

G04 continúa tras publicar la música protegida (PR 46). Scratch presenta la
frase por adelantado con notas que llegan desde la derecha a una marca dorada
fija. El jugador termina el gesto al alcanzar esa marca. La dirección y el
recorrido siguiente permanecen grandes sobre el plato; la preparación indica
cuántos pulsos faltan.

Tras cada gesto válido se muestra PERFECTO, ADELANTADO o TARDE y su diferencia
respecto al pulso en milisegundos. El aviso se mantiene brevemente aunque la
persona levante el dedo para recolocarlo. El resultado distingue frases cerradas
y gestos perfectos sobre los aceptados; el porcentaje mide precisión de los
gestos aceptados, no la proporción de frases completadas.

Reducir movimiento y Efectos suaves usan una frase fija con el siguiente gesto
resaltado. No desplazan las notas ni animan el aro del pulso. La interacción del
plato sigue respondiendo a la mano.

## Reglas conservadas

- Baby Scratch, Long Pull, Double Time y Boomerang mantienen dirección, distancia,
  ventanas, dificultad, puntos y duración. Una frase incompleta no concede puntos.
- No cambian los récords, multiplicadores, vidas ni el tiempo de sesión.
- La lectura usa el mismo reloj que juzga los gestos. Funciona a 120 BPM en
  Ensayo y al pulso aproximado de 127 BPM de los dos temas protegidos.
- Pausar congela notas y precisión. Ocultar la página, girar o perder foco
  conserva la pausa; no se reanuda automáticamente.
- Portada aprobada, modos, Vinyl Cut, Destrucción, música protegida y `/test`
  se conservan. Sin archivos de audio, tokens ni enlaces firmados en GitHub.
- G04 sigue parcial: no se ha creado un beatmap musical editado ni se acredita
  la valoración subjetiva del propietario durante una sesión prolongada.
  G08 continúa pendiente; estos resultados no otorgan DANZPOINTS.

## Verificación

- 271 pruebas internas correctas, incluidas precisión adelantada/tardía a ambos
  tempos, cancelación, frase perdida y simulación de un minuto con los cuatro
  patrones. El build y las pruebas de navegador se registran al cerrar CI.
- Nuevos escenarios de navegador: marca y pausa, movimiento reducido/efectos
  suaves, minuto completo y frase con tacto real de Chromium en 390×844,
  320×568 y 844×390. Capturas adjuntas al informe de pruebas.
- Auditoría pendiente hasta inspeccionar capturas y versión pública. T01
  conserva teléfono físico, GPU/FPS, batería y audio oído.

## Referencias consultadas

- MDN mediante Context7: reloj de animación y pausa por `visibilitychange`.
  Se conserva el reloj existente, sin segundo temporizador ni nueva animación CSS.
- Hugging Face consultado: [ginchiostro/beat_tracking](https://hf.co/spaces/ginchiostro/beat_tracking).
  Su ficha no declara licencia ni límites/API suficientes para adoptar el servicio;
  no aporta una mejora a esta lectura visual. No se añade dependencia ni se
  envía audio privado al servicio.
