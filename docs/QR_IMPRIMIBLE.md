# QR general para imprimir

El cartel «La noche nos une» abre la PWA pública en:

https://danz-collective-demo.right-vine-9666.chatgpt.site/

Es acceso general a la aplicación. No incluye el código de asistencia de una
fiesta ni concede un sello. Ese QR se emitirá desde Administración para el
evento correspondiente una vez completada la verificación del propietario.

Imprimir en A4 vertical, a tamaño real, conservando toda la zona blanca alrededor
del QR. No añadir dibujos sobre sus módulos. El propio PDF contiene gráficos
vectoriales y un enlace pulsable sobre el QR.

Se puede regenerar con Python, qrcode 8.2, Pillow y reportlab:

```sh
python scripts/make-print-qr.py --output DANZ-Amor-A4.pdf
```

El lector zxing-cpp 2.3.0 ha reconocido la dirección exacta en el QR aislado y en
el cartel renderizado: cuatro rotaciones, escala reducida y escala de grises,
doce comprobaciones. Falta la comprobación física de la copia impresa con un móvil.

La flor se ha reconstruido como gráfico vectorial a partir de la referencia
del colectivo. El logotipo tipográfico procede del archivo público de su web:
https://danzcollective.com/cdn/shop/files/ASSETS_FISICOS_COLLECTIVO_-_illustrationImage.png?v=1772114513
