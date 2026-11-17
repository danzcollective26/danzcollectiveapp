# generate-kart-head

Función opcional. Si faltan los secretos, responde `{ "available": false }` y
DANZPORTER dibuja el cabezón en el dispositivo. No elige un proveedor de pago.

## Secretos

Configurarlos solo en la función, nunca en Vite ni en el cliente:

| Secreto | Uso |
| --- | --- |
| `KART_HEAD_API_KEY` | Token que la función envía como `Authorization: Bearer`. |
| `KART_HEAD_API_URL` | URL `https://` del endpoint. Sin esta URL la función no llama a nadie. |

Contrato esperado del endpoint, a propósito genérico:

```json
{ "prompt": "…", "images": ["<base64>"] }
```

Respuesta:

```json
{ "image": "<base64 png>" }
```

Hugging Face u otro estudio gratuito encajan si exponen ese contrato. No hay
un proveedor activado en este repositorio. Las fotos se reenvían solo en esa
llamada y no se escriben en Storage ni en registros.

La sesión tiene que ser de una cuenta real. Sin sesión, el cliente no llama y
usa el dibujo local. La migración `kart_heads` no está aplicada: el guardado
en cuenta sigue apagado hasta que el propietario la ejecute.
