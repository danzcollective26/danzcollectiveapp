# Entrada rápida y registro posterior

Petición del propietario, 10 de noviembre de 2026: la llegada a la fiesta no debe
exigir instalar la app, rellenar un perfil, configurar un autenticador ni esperar
un correo. Debe poder guardarse el pase al abrir el enlace del QR y continuar.

## Recorrido implementado

1. La cámara lee el QR del evento. El asistente toca el enlace y abre la PWA.
2. El código se guarda automáticamente en ese navegador. Aparece «Pase guardado»;
   no hay que reenviar un formulario ni iniciar sesión para guardarlo localmente.
3. Puede cerrar la página o pulsar «Seguir con mi noche». «Vincular mi pase» abre
   el acceso para quien quiera completar su cuenta en ese momento.
4. Al volver desde el mismo navegador, conserva el pase pendiente. Google está
   operativo y probado con la cuenta del propietario. Apple tiene el flujo de
   cliente preparado, pero sigue desactivado hasta configurar Apple Developer.
5. El sello definitivo y el acceso a fotos solo se conceden al iniciar sesión y
   canjear un código válido. La verificación adicional de DANZ es para administrar,
   no es un paso obligatorio del acceso normal de los asistentes.

Guardar el pase no necesita una solicitud de alta, canje o correo. No acredita por
sí solo asistencia ni abre galerías. Si el navegador impide guardar datos, la app
muestra la advertencia y conserva el código en pantalla, sin anunciar un guardado
correcto. Una restricción de history.replaceState no impide guardar ni navegar.

## Límites que hay que resolver antes del evento

- Debe abrirse alguna página: apuntar la cámara al QR sin tocar su enlace no puede
  escribir datos en el móvil. No se instala ni se abre una app nativa.
- El guardado previo al registro pertenece a ese navegador. Borrar sus datos,
  cambiar de navegador o la eliminación de almacenamiento por el sistema puede
  hacerlo desaparecer. La cuenta es la vía para conservar sellos entre dispositivos.
- El código debe seguir vigente al canjearse y el evento debe admitir canjes.
  Guardarlo localmente no reserva cupo ni prolonga su caducidad. Para permitir
  canjes después de la fiesta, preparar una ventana adecuada y no archivar el
  evento antes de ese plazo; una reserva anónima verificable en servidor no está
  implementada. No prometer un sello permanente antes de haberlo vinculado.
- La PWA publicada sigue privada en Sites. El acceso sin ChatGPT para asistentes
  requiere abrir su audiencia, conservando los permisos de fotos y administración.
  No se ha cambiado ese acceso en esta entrega.
- No se garantiza que Google/Apple completen un primer alta en un único toque:
  pueden pedir selección de cuenta, contraseña, consentimiento o validación.
- La capacidad de 200 altas todavía requiere la prueba de carga y los límites
  documentados en ACCESO_GOOGLE_APPLE_200_ALTAS.md.

## Apple

La PWA usa un cliente web: App ID con Sign in with Apple, Services ID asociado,
Team ID y clave de firma del programa Apple Developer. El titular conserva la
clave .p8 y configura el secreto directamente en Supabase; no se comparte en chat,
Git ni Vite. Se consulta si el colectivo ya dispone de esa cuenta antes de una
contratación o creación de credenciales. Dominio y retorno preparados:

- Dominio: ttgehdknhnrxtddxpknc.supabase.co
- Retorno: https://ttgehdknhnrxtddxpknc.supabase.co/auth/v1/callback

El secreto OAuth de Apple requiere renovación al menos cada seis meses. No se
activa un botón de Apple sin que el servidor confirme habilitado el proveedor.

Fuentes oficiales revisadas:
- https://supabase.com/docs/guides/auth/social-sign-in/auth-apple
- https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/
