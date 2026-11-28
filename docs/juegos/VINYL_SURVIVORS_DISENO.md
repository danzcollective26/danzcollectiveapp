# Vinyl Survivors — diseño inicial

**Estado:** diseño inicial (hilo 11 de Grok, 16–17/11/2026). Faltan las respuestas del
test de abajo. Reconstruido por Claude a partir del hilo.

## Decidido por el propietario
- Supervivencia de oleadas tipo Vampire Survivors en un after o festival.
- Modo **cenital** primero. Un posible modo Metal Slug lateral, después o como hilo aparte.
- Pool de 6–7 habilidades; **3 por partida**; cada una sube de nivel
  (más amplitud, escudo más grande, vinilos que giran alrededor…).
- Oleadas cada vez mayores.

## Propuesto por Grok (sin confirmar)
- Protagonista Ron0 (u otro DJ del colectivo desbloqueable). Solo se mueve; los poderes disparan solos.
- Bucle: moverse y recoger trozos de vinilo (XP) → subir de nivel → elegir entre 3 mejoras → run completa → moneda permanente para desbloqueos.
- Poderes: Imán de vinilos, Lanza-camisetas, Cámara lenta, Bass Drop (onda), Láseres giratorios, Confeti explosivo, Scratch, Vinilo bumerán. Evoluciones al combinar dos.
- Enemigos: haters (en manada), resacas (lentos, dejan charcos), fact-checkers (a distancia), seguridad e influencers. Jefes: Hater Final, Mega-Resaca, Fact-Check Supremo.
- Mapas: pista principal, zona chill, backstage, terraza.

## Nota de estilo
Grok propuso pixel art Metal Slug. Después el propietario rechazó el pixel para Manager
Heist y fijó **3D cartoon premium como las portadas** para juegos nuevos. Recomendación:
mismo estilo y assets que el futuro Manager Heist zombi-club. Confirmar en el test.

## Técnica recomendada
Phaser 4 (ya instalado) con sprites prerrenderizados de modelos 3D cartoon (CC0 o
generados), joystick táctil reutilizando `VersusJoystick`, pausa al ocultar la pestaña,
movimiento reducido y PARTY OVER. Sin DANZPOINTS desde el cliente.
