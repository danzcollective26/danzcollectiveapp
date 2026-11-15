# DANZ Kart Mini — acabado 3D, 16/11/2026

El propietario solicita terminar Kart con un acabado muy cuidado y buscar los
recursos necesarios. El alcance es el juego local: Crew Race, Contrarreloj y
duelo en un mismo móvil. Online conserva su estado separado.

## Implementado, pendiente de revisión visual de esta versión

- Presentación 3D real en Three.js 0.186.0, con cámara de seguimiento o de toda
  la pista. Se conserva la física fija ya probada: no se migran los motores de
  Jack, Groove ni Collecta. Phaser queda disponible para la vista compatible.
- Kart original con carrocería redondeada, pintura barnizada, metal, neumáticos,
  piloto con casco/visera, volante y brazos. Cuatro carrocerías cosméticas.
- Circuitos con asfalto texturizado, normal map, pianos, barreras, garaje de la
  crew, contenedores, palmeras, focos y pórtico de salida. Iluminación ambiental,
  sombras y materiales. Minimap en seguimiento, velocímetro, huellas e impulso.
- Sonido original sintetizado de motor, ruedas, salida, impulso, vueltas y
  llegada. Arranca con el gesto de jugar y se suspende al pausar; se puede apagar.
- Ajustes persistentes: cámara, carrocería, sonido y calidad. Automático, ligero,
  alta y compatible 2D. En duelo se conserva vista de toda la pista y mandos
  enfrentados. Con reducir movimiento se usa vista estable sin huellas/fuego.
- Podio, clasificación de llegada, mejor vuelta y récord personal de sesión.
  No se conceden DANZPOINTS ni se inventan competiciones online.
- Objetivo de render 60 Hz, o 30 Hz en ligero; no equivale a FPS medidos en un
  móvil físico. Resolución acotada, instancias de barreras y texturas de 512 px.

## Recursos examinados y usados

| Recurso | Procedencia y licencia | Uso |
| --- | --- | --- |
| Asphalt Track | Poly Haven, Dimitrios Savva, CC0 | Difuso y normal OpenGL originales 1K, optimizados a WebP de 512 px; 32.108 y 10.576 bytes. Incorporados al repo y preparación offline. |
| Three.js 0.186.0 | Three.js, MIT | Renderer 3D local; licencia en `public/arcade/kart/CREDITS.txt`. |
| Car Kit / Racing Kit | Kenney, CC0 según páginas oficiales | Evaluados. Descarga del sitio devuelve 403 en este entorno; no incorporados ni presentados como usados. |
| Kart, piloto, escenario, señalética y audio | Creación original del proyecto | Modelado y síntesis locales, sin servicios externos en tiempo de juego. |

Fuentes: https://polyhaven.com/a/asphalt_track · https://polyhaven.com/license ·
https://api.polyhaven.com/files/asphalt_track · https://threejs.org/docs/ ·
https://kenney.nl/assets/car-kit · https://kenney-assets.itch.io/car-kit

No hay recursos de pago ni claves nuevas. Los mapas se descargaron mediante la
API pública y se sirven localmente. No se usa el render promocional de un autor
como textura ni se copia su logotipo. Las portadas de los otros juegos siguen intactas.

## Verificación

Las 227 pruebas internas previas pasan después de instalar la dependencia.
Se añade prueba de preferencias corruptas/inaccesibles y se preparan escenarios
de cambio 3D/2D para navegador. La revisión conectada y la producción se anotarán
al cerrar. CI anterior 197 no ejecutó pasos: T04 sigue abierto hasta obtener
evidencia nueva. T01 conserva la prueba física de tacto, batería y FPS.
