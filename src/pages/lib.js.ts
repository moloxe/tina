import type { APIRoute } from 'astro'

const TINA = (await import('@src/pages/_lib/tina.js?raw')).default
const TINA_COMMON = (await import('@src/pages/_lib/tina.common.js?raw')).default
const TINA_RAYMARCH_LIGHT = (
  await import('@src/pages/_lib/raymarch/light.js?raw')
).default
const TINA_RAYMARCH_MATERIAL = (
  await import('@src/pages/_lib/raymarch/material.js?raw')
).default
const TINA_RAYMARCH_SCENE = (
  await import('@src/pages/_lib/raymarch/scene.js?raw')
).default
const TINA_RAYMARCH = (await import('@src/pages/_lib/raymarch/raymarch.js?raw'))
  .default
const TINA_RAYMARCH_CAPSULE_COLLISIONS = (
  await import('@src/pages/_lib/raymarch/collisions.capsule.js?raw')
).default
const TINA_KEYBOARD = (await import('@src/pages/_lib/utils/keyboard.js?raw'))
  .default

const SCRIPT = [
  TINA_KEYBOARD,
  TINA_COMMON,
  TINA_RAYMARCH_CAPSULE_COLLISIONS,
  TINA_RAYMARCH,
  TINA_RAYMARCH_MATERIAL,
  TINA_RAYMARCH_SCENE,
  TINA_RAYMARCH_LIGHT,
  TINA,
].join('\n')

export const GET: APIRoute = async () => {
  return new Response(SCRIPT, {
    headers: { 'Content-Type': 'application/javascript' },
  })
}
