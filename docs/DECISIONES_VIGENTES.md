# DANZ — decisiones vigentes y aceptación (actualizado 20/11/2026)

> **Fuente de verdad operativa para ChatGPT, Grok, Codex y colaboradores.** Si un documento histórico contradice estas decisiones, no se modifica el producto según el documento antiguo: se solicita revisión. No reemplaza los permisos de Supabase ni las instrucciones de seguridad de `AGENTS.md`.

## Protocolo de trabajo
- Desarrollar solo en ramas de pruebas y entregar lotes de 3–4 funcionalidades para revisión **conjunta** del propietario en su móvil; publicar en `main` solo tras su aprobación.
- Los diseños aprobados, rostros, portadas, logotipos y controles no se rediseñan automáticamente.
- Verificar `npm run build`, `npm test`, test E2E móvil/tableta/escritorio y reglas de privacidad; comunicar fallos sin ocultarlos.
- Separar escrupulosamente **propuesto**, **codificado**, **compilado**, **probado automáticamente**, **probado en móvil real**, **aprobado** y **publicado**.
- GitHub es público intencionadamente para permitir colaboración con Grok. No incluir datos personales privados, claves, JWT ni originales de fotografías.

## Inicio: cartera física de dos tarjetas
- `MI CUENTA` arriba, `MI PASAPORTE` debajo. Deben entenderse ambas tarjetas, como bolsillos de una cartera, **sin solaparse ni taparse**.
- Mi Cuenta muestra iconos visibles de Instagram, DANZPOINTS y sellos. Al pulsar abre **primero una tarjeta de socio**, nunca un formulario editor.
- El Pasaporte abre un lector inmersivo desde cualquier entrada, incluido DANZERS; sin botones de página superpuestos. Botón cerrar vuelve al origen.
- El diseño del pasaporte físico, cuero oscuro y hojas claras aprobadas se mantiene; solo se arreglan fallos funcionales y de encaje.

## Mi Cuenta / tarjeta de miembro
- Foto personal cuando exista (por ahora puede ser un marcador, sin prometer fotografía descargada automáticamente desde Instagram).
- Alias, **número real de socio** independiente del código DANZPOINTS, fecha de alta, sellos y saldo de puntos, accesos a Instagram y Pasaporte.
- Resumen visible de primeras; detalles mediante desplegables; editar exclusivamente tras `Administrar mi perfil`.
- La futura tarjeta pública a la que accedan otros miembros requiere campos visibles aprobados individualmente y controles de privacidad claros.
- Compartir fotos de álbumes privados requiere consentimiento explícito **por foto/álbum**, preservando los originales y galerías privadas.

## Instagram
- Es verificación **manual mediante código y aprobación**, no OAuth nativo de Instagram ni permiso para descargar avatar.
- Un alias escrito no prueba vínculo; informar correctamente estado pendiente, verificado, rechazado o cambiado.
- Tarjeta pública de Instagram **desactivada por defecto**; debe autorizarse y estar verificada. Ocultarla no retira los puntos ni la vinculación.
- La foto de perfil solo se obtiene con consentimiento y método autorizado, o el miembro la sube directamente.

## DANZ / ARCADANZ
- Mantener la flor de seis pétalos, branding aprobado y portadas originales de cada juego; evitar recrear rostros y assets sin petición.
- Navegación tipo videojuegos clásicos para menú Arcade, respuesta táctil inmediata y pantalla completa real al jugar.
- DANZPORTER, Groove Ninja, Snake, Yeppo y demás juegos siguen sus propios documentos de mecánica y aprobaciones.
- Música ajena solo con licencias y autorización; no copiar otros juegos ni portada de forma literal.

## Estado del bloque activo (ver PR #64)
- En preview: nueva cartera apilada y tarjeta compacta, lector inmersivo, Instagram de verificación manual y privacidad.
- En automatización: tests de contrato de Pasaporte y cartera. Algunos E2E antiguos siguen esperando interfaz de Cuenta anterior; corregir antes de fusionar.
- **Pendiente:** validar vista móvil real, foto persistente, ficha pública completa y compartición selectiva de fotografías, test final y aprobación.
- No afirmar que el proyecto está terminado por el simple hecho de un despliegue Vercel en READY.

## Calidad y herramientas
- Prioridad P0: decisiones coherentes, test visual y gestos, copia/recuperación verificable de Supabase, permisos.
- Prioridad P1: Dependabot agrupado, accesibilidad axe, Lighthouse y métricas Web Vitals. Instalar solo en tareas justificadas y medir coste.
- Prioridad P2: Storybook, herramientas adicionales de capturas, análisis avanzados, nuevas plataformas, solo si hay necesidad demostrada.
- Figma, GitHub, Vercel, Supabase y Hugging Face están ya integrados en el entorno de trabajo. No pedir reinstalarlos.
- Las issues [#62](https://github.com/danzcollective26/danzcollectiveapp/issues/62) y [#63](https://github.com/danzcollective26/danzcollectiveapp/issues/63) son el seguimiento técnico.
