import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

import TINA from '../tina/lib/tina' with { type: 'text' }
import TINA_COMMON from '../tina/lib/tina.common' with { type: 'text' }
import TINA_RAYMARCH_LIGHT from '../tina/lib/raymarch/light' with { type: 'text' }
import TINA_RAYMARCH_MATERIAL from '../tina/lib/raymarch/material' with { type: 'text' }
import TINA_RAYMARCH_SCENE from '../tina/lib/raymarch/scene' with { type: 'text' }
import TINA_RAYMARCH from '../tina/lib/raymarch/raymarch' with { type: 'text' }
import TINA_RAYMARCH_CAPSULE_COLLISIONS from '../tina/lib/raymarch/collisions.capsule' with { type: 'text' }
import TINA_KEYBOARD from '../tina/lib/utils/keyboard' with { type: 'text' }

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

const app = new Elysia()
  .use(cors())
  .get('/', async () => {
    return SCRIPT
  })
  .listen(8887)

console.log(`Tina: ${app.server?.url}`)
