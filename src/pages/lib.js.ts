import { minify } from 'terser'
import TINA from '@src/lib/tina?raw'
import TINA_COMMON from '@src/lib/tina.common?raw'
import TINA_RAYMARCH_LIGHT from '@src/lib/raymarch/light?raw'
import TINA_RAYMARCH_MATERIAL from '@src/lib/raymarch/material?raw'
import TINA_RAYMARCH_SCENE from '@src/lib/raymarch/scene?raw'
import TINA_RAYMARCH from '@src/lib/raymarch/raymarch?raw'
import TINA_RAYMARCH_CAPSULE_COLLISIONS from '@src/lib/raymarch/collisions.capsule?raw'
import TINA_KEYBOARD from '@src/lib/utils/keyboard?raw'

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

export const GET = async () => {
  const minified = await minify(SCRIPT)
  return new Response(minified.code, {
    headers: { 'Content-Type': 'application/javascript' },
  })
}
