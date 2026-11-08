import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authErrorMessage, clientConfiguration, consumeCallbackError, consumeCompletedCallback } from '../src/auth/config.ts'

const url = 'https://danz-test.supabase.co'
const key = 'sb_publishable_danz_test_key'
const jwt = (role: string) => ['e30', Buffer.from(JSON.stringify({ role })).toString('base64url'), 'synthetic-signature'].join('.')

test('cliente acepta publishable/anon y rechaza claves servidor y URLs no previstas', () => {
  assert.deepEqual(clientConfiguration(url, key).config, { url, key })
  assert.equal(clientConfiguration(url, jwt('anon')).config?.url, url)
  for (const invalidKey of ['sb_secret_never_in_client', jwt('service_role'), jwt('authenticated'), 'random']) {
    assert.equal(clientConfiguration(url, invalidKey).config, null)
  }
  for (const invalidUrl of ['http://danz-test.supabase.co', 'https://evil.example', 'https://user:pass@danz-test.supabase.co', url + '/wrong', url + '?token=secret']) {
    assert.equal(clientConfiguration(invalidUrl, key).config, null)
  }
  assert.equal(clientConfiguration('http://localhost:54321', key, false).config, null)
  assert.equal(clientConfiguration('http://localhost:54321', key, true).config?.url, 'http://localhost:54321')
  assert.equal(clientConfiguration(undefined, undefined).config, null)
})

test('callback elimina errores y tokens sin mostrar descripciones externas', () => {
  const result = consumeCallbackError(url + '/?error=access_denied&error_description=UNTRUSTED&error_code=otp_expired&code=secret#access_token=secret&refresh_token=secret')
  assert.equal(result.url, url + '/')
  assert.match(result.message!, /caducado/)
  assert.doesNotMatch(result.message!, /UNTRUSTED|secret/)
  const ordinary = url + '/?code=pkce-code'
  assert.deepEqual(consumeCallbackError(ordinary), { url: ordinary, message: null })
})

test('errores de Auth traducidos desde códigos y sin interpolar mensajes del servidor', () => {
  assert.match(authErrorMessage({ status: 429 }), /Espera antes/)
  assert.match(authErrorMessage({ code: 'otp_expired' }), /caducado/)
  assert.match(authErrorMessage({ code: 'email_provider_disabled' }), /no está habilitado/)
  assert.doesNotMatch(authErrorMessage({ message: 'secret access_token' }), /secret|access_token/)
})


test('callback terminado elimina códigos residuales y los identificadores del flujo', () => {
  const missing = consumeCompletedCallback(url + '/?code=sensitive-code&sb_flow_id=flow&__sb_flow_id=legacy&keep=1')
  assert.equal(missing.url, url + '/?keep=1')
  assert.match(missing.message!, /caducado|este navegador/)
  assert.doesNotMatch(missing.message!, /sensitive-code|legacy/)
  const completed = consumeCompletedCallback(url + '/')
  assert.deepEqual(completed, { url: url + '/', message: null })
})
