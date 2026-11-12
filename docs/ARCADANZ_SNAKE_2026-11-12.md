# ARCADANZ · actualización de Snake

- Tablero de 19 × 19 casillas y seis laberintos conectados, con aparición inicial segura.
- Un giro válido mueve al instante. Una segunda esquina queda en cola hasta el siguiente movimiento; no se permite invertir hacia el cuerpo ni sobrescribir esa esquina.
- Los gestos se reconocen desde 12 px y durante el movimiento del dedo; el mando responde al presionar. El temporizador se reinicia después de un giro inmediato.
- JUGAR solicita pantalla completa nativa. Si no está disponible, se usa una pantalla de juego que ocupa el viewport. Salir, Escape o abandonar la pestaña pausa la partida. Hay disposición propia para móvil horizontal.
- Diez caras originales recuperadas del paquete histórico, recortadas como sprites. Los originales y las interfaces del teléfono no se publican. Aparecen como objetivos y discretamente en el cuerpo tras recogerlas. La cabeza conserva la flor.
- Portada del cable que huye aprobada por el usuario e integrada. ARCADANZ conserva el logotipo aprobado.
- El nombre continúa siendo DANZ SNAKE hasta elegir uno. Propuestas: JACK A LA FUGA, CABLE SUELTO, NO ME DESENCHUFES, DANZPLUG, JACK & RUN y FUERA DE JACK. Ninguna está aprobada todavía.
- Idle Studio sigue marcado como próximamente. Los récords del Snake son locales y aún no conceden DANZPOINTS.
- Todos los rótulos de navegación están en mayúsculas. El trabajo de EQUIPO está aparcado en su rama, pendiente de los datos que el usuario dará más adelante.

Verificación: reglas y conectividad en pruebas internas; pruebas de navegador con reloj controlado para giro antes de levantar el dedo, cola, pausa, caras, salida y tamaños móviles. Registrar el resultado de CI y la publicación en el documento de continuidad.
